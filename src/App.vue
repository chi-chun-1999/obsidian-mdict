<template>
    <h2>Hello,Developer!</h2>
    <Hello></Hello>
    <HiHi></HiHi>
	<button @click="definition">Search</button>
	<div ref="containerRef" v-html="mdictResult"></div>

</template>

<script setup lang="tsx">
import Hello from "./Hello";
import Hi from "./Hi.vue";
import {MdictEngine} from './mdictEngine';


import { ref, watch, nextTick } from "vue";
let hi = ref("");
let HiHi = () => (<h1><Hello></Hello></h1>)
// let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.mdx");
let mdictEngine = new MdictEngine("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/CALD4/CALD4.mdx");

let mdictResult = ref("");
const containerRef = ref<HTMLDivElement | null>(null);

let definition = async () => {
	let result = await mdictEngine.lookup("cat");
	mdictResult.value = result;
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

async function updateImageSources(){
	if (!containerRef.value){
		console.warn("containerRef is not set.");
		return;

	} 

	const images = containerRef.value.querySelectorAll('img');
	for (const img of images) {
		let src = img.getAttribute('src');
		// console.log("Image src:", src);
		if (src ) {
			src = src.replaceAll('/','\\');
			src = '\\' + src; // Ensure src starts with '//' for lookup
		// console.log("Image src:", src);
		
			// console.log(mdictEngine.lookupMdd(src));
			const imageData = await mdictEngine.lookupMdd(src);
			if (!imageData) {
				// console.warn(`Image data not found for src: ${src}`);
				continue;
			}

			// Convert the image data to a base64 string
			// const base64String = arrayBufferToBase64(imageData);
			// Set the src attribute to the base64 encoded string
			img.setAttribute('src', `data:image/png;base64,${imageData}`);
			// console.log(`Updated image src to base64 for: ${src}`);




			// const base64Data = src.split(',')[1];
			// const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
			// const base64String = arrayBufferToBase64(buffer);
			// img.setAttribute('src', `data:image/png;base64,${base64String}`);
		}
	}

}


watch(mdictResult, async () => {
	await nextTick();
	// console.log("mdictResult changed:---------");
	updateImageSources();
});


function InitTest(){
	let result = mdictEngine.lookup("dog");
	// console.log("InitTest result:", result);
	mdictResult.value = result;
}

InitTest();


</script>



<style>
@import url('/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.css');
</style>
