import fs from 'fs';
import { spxBase64ToMp3Base64 } from './mdictEngine';

// Read the mdx and mdd files path from folder path
export function getMdxMddPaths(folderPath: string): { mdxPath: string; mddPath: string | null } | null {
	if (!fs.existsSync(folderPath)) {
		return null;
	}
	const files = fs.readdirSync(folderPath);
	const mdxFile = files.find(file => file.endsWith('.mdx'));
	const mddFile = files.find(file => file.endsWith('.mdd'));
	if (!mdxFile) {
		return null;
	}
	const mdxPath = `${folderPath}/${mdxFile}`;
	const mddPath = mddFile ? `${folderPath}/${mddFile}` : null;
	return { mdxPath, mddPath };
}

export function getCssPaths(folderPath: string): string {
	if (!fs.existsSync(folderPath)) {
		return null;
	}
	const files = fs.readdirSync(folderPath);
	const cssFiles = files.find(file => file.endsWith('.css'));
	const cssPaths = cssFiles ? `${folderPath}/${cssFiles}` : null;

	return cssPaths;
	
}

export function arrayBufferToBase64(buffer:string) {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

export function base64ToArrayBuffer(base64:string) {
	const binaryString = window.atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}

export function playAudio(soundData: string, soundType: string) {
	const audio = new Audio();
	let soundUrl = "";

	if (soundType === "spx") {
		spxBase64ToMp3Base64(soundData).then((mp3Base64) => {
			soundUrl = `data:audio/mpeg;base64,${mp3Base64}`;
			audio.src = soundUrl;
			audio.play();
		}).catch((error) => {
			console.error("Error converting SPX to MP3:", error);
		});
	} else if (soundType === "mp3") {
		soundUrl = `data:audio/mpeg;base64,${soundData}`;
		audio.src = soundUrl;
		audio.play();
	} else if (soundType === "wav") {
		soundUrl = `data:audio/wav;base64,${soundData}`;
		audio.src = soundUrl;
		audio.play();
	} else {
		console.error("Unsupported sound type:", soundType);
	}

	audio.onended = () => {
		audio.remove();
	}

}
