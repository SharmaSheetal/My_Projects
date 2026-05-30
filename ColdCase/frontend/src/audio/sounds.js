import { Howl } from "howler";
import ambientLoopFile from "../assets/audio/ambient-loop.mp3";
import typewriterClickFile from "../assets/audio/typewriter-click.mp3";
import contradictionSparkFile from "../assets/audio/contradiction-spark.mp3";

export const ambientLoop = new Howl({
    src: [ambientLoopFile],
    loop: true,
    volume: 0.12,
    html5: true,
});

export const typewriterClick = new Howl({
    src: [typewriterClickFile],
    volume: 0.2,
    preload: true,
    loop: false,
    pool: 1,
});

export const contradictionSpark = new Howl({
    src: [contradictionSparkFile],
    volume: 0.35,
    preload: true,
    loop: false,
});