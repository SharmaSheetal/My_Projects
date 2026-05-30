import json
import os

def test_progress_pivots():
    """Validates the structure and content of progress_pivots.json."""
    print("--- Testing Progress Pivots ---")
    
    file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'progress_pivots.json')
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return False
        
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        if "pivot_moments" not in data:
             print("Error: 'pivot_moments' key not found in root.")
             return False
             
        pivots = data["pivot_moments"]
        print(f"Loaded {len(pivots)} progress pivots.")
        
        required_keys = ["id", "description", "points", "detection_condition"]
        
        for pivot in pivots:
            for key in required_keys:
                if key not in pivot:
                    print(f"Error: Pivot '{pivot.get('id', 'UNKNOWN')}' is missing required key '{key}'.")
                    return False
                    
            if not isinstance(pivot["points"], int) or pivot["points"] <= 0:
                print(f"Error: Pivot '{pivot['id']}' has an invalid points value '{pivot['points']}'. Must be a positive integer.")
                return False
                
        print("Progress pivots structural validation passed.")
        return True
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_progress_pivots()
