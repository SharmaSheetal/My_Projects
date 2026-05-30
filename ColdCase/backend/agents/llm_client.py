import logging
from google import genai
from google.genai.errors import ClientError
from backend.config import settings

log = logging.getLogger(__name__)

# Initialize a single client using the primary key
_client = genai.Client(api_key=settings.gemini_api_key)

def get_current_client() -> genai.Client:
    """Returns the active Gemini client."""
    return _client

def execute_with_fallback(func, *args, models=None, **kwargs):
    """
    Executes a Google GenAI function, automatically rotating models 
    if a ResourceExhausted (429) error occurs.
    
    Args:
        func: The function to execute. The first two arguments must be (client, model_name).
        *args: Additional positional arguments for the function.
        models: An optional list of model names to try in order (e.g., ["gemini-2.5-pro", "gemini-2.5-flash"]).
        **kwargs: Additional keyword arguments for the function.
    """
    from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

    # Default to just Flash if not provided, but mostly PersonaAgent will provide a list
    fallback_models = models if models else ["gemini-2.5-flash"]
    _current_model_index = 0

    def is_rate_limit(exception):
        return isinstance(exception, ClientError) and exception.code == 429

    max_attempts = max(15, len(fallback_models))
    
    @retry(
        wait=wait_exponential(multiplier=0.5, min=0.5, max=10),
        stop=stop_after_attempt(max_attempts),
        retry=retry_if_exception_type(ClientError)
    )
    def _run_with_retry():
        nonlocal _current_model_index
        client = get_current_client()
        current_model = fallback_models[_current_model_index]
        
        try:
            return func(client, current_model, *args, **kwargs)
        except ClientError as e:
            if getattr(e, 'code', None) == 429:
                log.warning(f" Rate limit hit on {current_model}.")
                
                # Time to downgrade the model.
                if len(fallback_models) > 1:
                    _current_model_index = (_current_model_index + 1) % len(fallback_models)
                    log.warning(f" Downgrading to fallback model: {fallback_models[_current_model_index]}")
                else:
                    log.error(" Rate limit hit, but no fallback models are configured! Waiting out the throttle...")
            raise # Let Tenacity retry

    return _run_with_retry()
