<template>
    <input v-model="searchWord" @keyup.enter="definition" placeholder="Search..." />
	<button @click="definition">Search</button>
	<div ref="containerRef" v-html="mdictResult" ></div>

</template>

<script setup lang="tsx">

import {MdictEngine, spxBase64ToMp3Base64, convertSpxBase64ToMp3Base64} from './mdictEngine';
// import {MdictEngine, spxBase64ToMp3Base64} from './mdictEngine';
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {parse} from 'node-html-parser';
import ffmpeg from 'fluent-ffmpeg';


let hi = ref("");
const searchWord = ref("");

function performSearch() {
    submittedWord.value = searchWord.value;
}
let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.mdx");
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/OALD9/OALD9EnEn.mdx");
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/CALD4/CALD4.mdx");
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/OELDOnlineV1-51/OELDOnlineV1-51.mdx");
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LomanPhrasalVerb/[英-英] Longman Phrasal Verbs Dictionary 2nd Edition.mdx");

let mdictResult = ref("");
const containerRef = ref<HTMLDivElement | null>(null);

let definition = async () => {
	
	let result = await mdictEngine.lookup(searchWord.value);
	searchWord.value = '';
	// const images = result.querySelectorAll('img');
	const root = parse(result);
	const images = root.querySelectorAll('img');
	if (images.length > 0) {
		// console.log("Images found:", images);
		// console.log("Image srcs:", images.map(img => img.getAttribute('src')));
		images.forEach(img => {
			let src = img.getAttribute('src');
			if (src) {
				src = src.replaceAll('/','\\');
				src = '\\' + src; // Ensure src starts with '//' for lookup
				img.setAttribute('src', src);

				// console.log("Updated image src:", src);
				const imageData = mdictEngine.lookupMdd(src);
				if (!imageData) {
					console.warn(`Image data not found for src: ${src}`);
					return;
				}
				img.setAttribute('src', `data:image/png;base64,${imageData}`);
			}
		});
	}

	mdictResult.value = root.toString();


}

async function handleContainerClick(event: MouseEvent){
	const target = (event.target as HTMLElement).closest('a[href]');



	if (!target){
		// console.log("event.target is not a sound link:", event.target);
		// console.log("Clicked selection:", window.getSelection()?.toString());
		if( window.getSelection()?.toString()){
			// console.log("Clicked selection is not empty, ignoring click event.");

			searchWord.value = window.getSelection()?.toString().toLowerCase() || '';
			
			definition();

			return;
		}

		return
	}

	else if (!target.getAttribute('href')?.startsWith('sound://')) {
		console.log("Clicked link is not a sound link:", target.getAttribute('href'));
		event.preventDefault();
		tmp = await mdictEngine.lookup(target.getAttribute('href') || '');
		console.log("tmp:", tmp);
		return;
	}
	
	event.preventDefault();
	const href = target.getAttribute('href');

	if (!href){
		return;
	}

	let soundData = href.substring('sound://'.length);
	// console.log("soundData:", soundData);
	const soundType = soundData.split('.').pop();
	// console.log("Sound type:", soundType);
	soundData = soundData.replaceAll('/','\\');
	soundData = '\\' + soundData; // Ensure soundData starts with '//' for lookup
	soundData = await mdictEngine.lookupMdd(soundData);

	if (!soundData) {
		console.error(`Sound data not found for href: ${href}`);
		return;
	}



	// const soundUrl = `data:audio/mpeg;base64,${soundData}`;
	const audio = new Audio();
	let soundUrl = "";

	if (soundType === 'mp3') {
		soundUrl = `data:audio/mpeg;base64,${soundData}`;
		audio.src = soundUrl;
		audio.type = 'audio/mpeg';
	} else if (soundType === 'ogg') {
		audio.type = 'audio/ogg';
	} else if (soundType === 'wav') {
		soundUrl = `data:audio/mpeg;base64,${soundData}`;
		audio.src = soundUrl;
		audio.type = 'audio/wav';
	} else if (soundType === 'aac') {
		audio.type = 'audio/aac';
	} else if (soundType === 'flac') {
		audio.type = 'audio/flac';
	} else if (soundType === 'spx'){
		// playSpxBase64(soundData);
		// Convert SPX to MP3
		const mp3Base64 = await spxBase64ToMp3Base64(soundData);
		// const mp3Base64 = await convertSpxBase64ToMp3Base64(soundData);
		if (!mp3Base64) {
			console.error("Failed to convert SPX to MP3");
			return;
		}
		soundUrl = `data:audio/mpeg;base64,${mp3Base64}`;
		audio.src = soundUrl;
		audio.type = 'audio/mpeg';

	} 
	else {
		console.error(`Unsupported sound type: ${soundType}`);
		return;
	}

	// console.log("Playing sound from URL:", soundUrl);
	// console.log(audio);
	audio.play();

	audio.onended = () => {
		URL.revokeObjectURL(soundUrl); // Clean up the URL after playback
	};

}

onMounted(() => {
	if (containerRef.value) {
		containerRef.value.addEventListener('click', handleContainerClick);
	}
});

function arrayBufferToBase64(buffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
	const binaryString = window.atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}

// async function updateImageSources(){
// 	if (!containerRef.value){
// 		console.warn("containerRef is not set.");
// 		return;
//
// 	} 
//
// 	const images = containerRef.value.querySelectorAll('img');
// 	for (const img of images) {
// 		let src = img.getAttribute('src');
// 		// console.log("Image src:", src);
// 		if (src ) {
// 			src = src.replaceAll('/','\\');
// 			src = '\\' + src; // Ensure src starts with '//' for lookup
// 		// console.log("Image src:", src);
//
// 			// console.log(mdictEngine.lookupMdd(src));
// 			const imageData = await mdictEngine.lookupMdd(src);
// 			if (!imageData) {
// 				// console.warn(`Image data not found for src: ${src}`);
// 				continue;
// 			}
//
// 			// Convert the image data to a base64 string
// 			// const base64String = arrayBufferToBase64(imageData);
// 			// Set the src attribute to the base64 encoded string
// 			img.setAttribute('src', `data:image/png;base64,${imageData}`);
// 		}
// 	}
//
// }
//
//
watch(mdictResult, async () => {
	await nextTick();
	// console.log("mdictResult changed:---------");
	// updateImageSources();
});


// function InitTest(){
// 	let result = mdictEngine.lookup("dog");
// 	// console.log("InitTest result:", result);
// 	mdictResult.value = result;
// }
//
// InitTest();


</script>



<style>
@import url('/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.css');
/* @import url('/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LomanPhrasalVerb'); */
/* @import url('/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/OALD9/OALD9EnEn.css'); */
/* @import url('/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/OELDOnlineV1-51/OELD_style.css'); */

* {
  -webkit-user-select: auto !important;
  -moz-user-select: inherit  !important;
  -ms-user-select: inherit  !important;
  user-select: auto  !important;
}

</style>
