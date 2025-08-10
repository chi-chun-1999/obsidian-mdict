<template>
    <input v-model="searchWord" @keyup.enter="definition" placeholder="Search..." />
	<button @click="definition">Search</button>
	<div ref="containerRef" v-html="mdictResult"></div>

</template>

<script setup lang="tsx">

import {MdictEngine} from './mdictEngine';
import { ref, watch, nextTick } from "vue";
import {parse} from 'node-html-parser';


let hi = ref("");
const searchWord = ref("");

function performSearch() {
    submittedWord.value = searchWord.value;
}
let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.mdx");
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/CALD4/CALD4.mdx");

let mdictResult = ref("");
const containerRef = ref<HTMLDivElement | null>(null);

let definition = async () => {
	
	let result = await mdictEngine.lookup(searchWord.value);
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

function arrayBufferToBase64(buffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
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
// watch(mdictResult, async () => {
// 	await nextTick();
// 	// console.log("mdictResult changed:---------");
// 	updateImageSources();
// });


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
</style>
