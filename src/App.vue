<template>



<div class="toolbar">
  <!-- 字典選擇 -->
  <div class="dict-select">
    <label for="dict">Dictionary:</label>
    <select id="dict" v-model="mdictSelected" @change="changeMdict">
      <option v-for="dict in mdictData" :value="dict.mdictFolderPath">{{ dict.mdictName }}</option>
    </select>
  </div>

  <!-- 搜尋列 -->
  <div class="search-bar">
	<button class="history-btn" @click="goBack" :disabled="historyIndex <= 0">&#8592;</button>
    <button class="history-btn" @click="goForward" :disabled="historyIndex >= wordHistory.length - 1">&#8594;</button>

    <input v-model="searchWord" @keyup.enter="definition" placeholder="Search..." />
    <button @click="definition">Search</button>
  </div>
</div>

<div ref="containerRef" v-html="mdictResult"></div>



</template>

<script setup lang="tsx">

import {MdictEngine, spxBase64ToMp3Base64, convertSpxBase64ToMp3Base64} from './mdictEngine';
// import {MdictEngine, spxBase64ToMp3Base64} from './mdictEngine';
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {parse} from 'node-html-parser';
import ffmpeg from 'fluent-ffmpeg';
import {Plugin} from 'obsidian';
import {getMdxMddPaths, getCssPaths, playAudio} from './helper.ts'
import fs from 'fs';


function updateMdictData() {
	// @ts-ignore
	// mdictData.value = app.plugins.plugins['obsidian-mdict'].settings.mdictData;
	mdictData.value = props.plugin.settings.mdictData;
	if (!mdictData || mdictData.length === 0) {
		console.warn("No MDIC data found in settings.");
		return;
	}
	// mdictSelected.value = app.plugins.plugins['obsidian-mdict'].settings.mdictData[0].mdictFolderPath || "";
	mdictSelected.value = props.plugin.settings.mdictData[0].mdictFolderPath || "";
	console.log("MDICT Data updated:", mdictData.value);
	// loadCss();

 

}

function goBack() {
	if (historyIndex.value > 0) {
		historyIndex.value--;
		searchWord.value = wordHistory.value[historyIndex.value];
		definitionHistory();
	}
}
function goForward() {
	// Future enhancement: Implement forward history if needed
	// Currently, this function does nothing
	if (historyIndex.value < wordHistory.value.length - 1) {
		historyIndex.value++;
		searchWord.value = wordHistory.value[historyIndex.value];
		definitionHistory();
	}

	return;
}

function getSettings() {
	// @ts-ignore
	// const settings = app.plugins.plugins['obsidian-mdict'].settings;
	console.log("Settings:", mdictSelected.value);
}

const props = defineProps<{
	plugin: Plugin;
	settings: any;
	}>();

const searchWord = ref("");
let mdictSelected = ref(app.plugins.plugins['obsidian-mdict'].settings.mdictData[0].mdictFolderPath || "");
// let mdictData = ref(app.plugins.plugins['obsidian-mdict'].settings.mdictData);
const mdictData = ref(props.plugin.settings.mdictData);


let mdictEngine = new MdictEngine(getMdxMddPaths(mdictSelected.value));

let wordHistory = ref<string[]>([]);
let historyIndex = ref(-1);
let mdictResult = ref("");
const containerRef = ref<HTMLDivElement | null>(null);


function changeMdict() {
	if (!mdictSelected.value) {
		console.warn("No MDIC selected.");
		return;
	}

	mdictEngine = new MdictEngine(getMdxMddPaths(mdictSelected.value));

	if (searchWord.value) {
		definition();
	} else {
		mdictResult.value = '';
	}
}

async function processMdictResult(result: string) {

	if (result.includes(`@@@LINK=`)){
		
		result = result.replaceAll('\n','').replaceAll('\r','');
		searchWord.value = result.replaceAll('@@@LINK=','').trim();

		result = await mdictEngine.lookup(searchWord.value);
		
	}

	const root = parse(result);

	// change css path
	const cssfile = root.querySelector('link[rel="stylesheet"]');
	if (cssfile) {
		const cssPath = mdictSelected.value+'/' + cssfile.getAttribute('href');
		// console.log("CSS Path:", mdictSelected.value, cssfile.getAttribute('href'), cssPath);
		cssfile.remove();
		try {
			let cssContent = fs.readFileSync(cssPath, 'utf-8');
			// replace all img[src*= to img[alt*=
			cssContent = cssContent.replaceAll('img[src*=', 'img[alt*=');
			
			const style = parse(`<style>${cssContent}</style>`);

			// root.appendChild(style);
			root.insertAdjacentHTML('beforeend', style.toString());
			

		} catch (e) {
			console.error("Error reading or injecting CSS:", e);
		}
	} else {
		// console.warn("No CSS file found in the result.");
	}

	const jsfiles = root.querySelectorAll('script[src]');
	if (jsfiles.length > 0) {
		jsfiles.forEach(jsfile => {
			// console.log("Removing JS file:", jsfile.getAttribute('src'));
			const jsPath = mdictSelected.value+'/' + jsfile.getAttribute('src');
			// console.log("JS Path:", mdictSelected.value, jsfile.getAttribute('src'), jsPath);
			// jsfile.setAttribute('src', jsPath || '');
			jsfile.remove();

			try {
				// console.log("Injecting JS file:", jsPath);
				const jsContent = fs.readFileSync(jsPath, 'utf-8');
				(0,eval)(jsContent);


			} catch (e) {
				console.error("Error reading or injecting JS:", e);
			}


		});
	}

	// remove tooltip
	const tooltipts = root.querySelectorAll('span[class="level tooltip"]');
	if (tooltipts.length > 0) {
		tooltipts.forEach(tooltip => {
			// tooltip.replaceWith(tooltip.innerHTML);
			// console.log("Removing tooltip:", tooltip.toString());
			tooltip.setAttribute('class', 'level');
		});
	}



	const images = root.querySelectorAll('img');
	if (images.length > 0) {
		images.forEach(img => {
			let src = img.getAttribute('src');
			const srcOri = src;
			// console.log("Original img src:", src);
			if (src) {
				if (src.includes('/')){
					src = src.replaceAll('/','\\');
					if (!src.startsWith('\\')) {
						src = '\\' + src; // Ensure src starts with '\' for lookup
					}
					// src = '\\' + src; // Ensure src starts with '\' for lookup
				}
				else {
					src = '\\' + src; // If no '/', just prepend '\'
				}

				img.setAttribute('src', src);

				const imageData = mdictEngine.lookupMdd(src);
				if (!imageData) {
					console.warn(`Image data not found for src: ${src}`);
					return;
				}
				img.setAttribute('src', `data:image/png;base64,${imageData}`);
				img.setAttribute('alt', srcOri || '');
			}
		});
	}

	const anchors = root.querySelectorAll('a[href^="entry://#"]');
	if (anchors.length > 0) {
		anchors.forEach(anchor => {
			let anchorLoc = anchor.getAttribute('href');
			anchorLoc = anchorLoc?.replace('entry://#', '#');
			anchor.setAttribute('href', anchorLoc || '#');


			// console.log("Found entry link, removing href");
			// console.log("anchor:", anchor.toString());
		});
	}
	return root.toString();
}

let definition = async () => {
	// console.log(mdictSelected.value);

	let result = await mdictEngine.lookup(searchWord.value);
	// searchWord.value = '';
	if (!result) {
		// console.warn(`No result found for: ${searchWord.value}`);
		mdictResult.value = `<div class="no-result">No result found for "${searchWord.value}"</div>`;

		let fuzzyResult = mdictEngine.fuzzyLookup(searchWord.value);

		if (fuzzyResult && fuzzyResult.length > 0) {
			let fuzzyHtml = `<div class="fuzzy-result"><p>Did you mean:</p><ul>`;
			fuzzyResult.forEach(word => {
				fuzzyHtml += `<li><a href="entry://${word}">${word}</a></li>`;
			});
			fuzzyHtml += `</ul></div>`;
			mdictResult.value += fuzzyHtml;
		}

		return;
	}

	wordHistory.value = wordHistory.value.slice(0, historyIndex.value + 1);
	wordHistory.value.push(searchWord.value);
	historyIndex.value = wordHistory.value.length - 1;

	mdictResult.value = await processMdictResult(result);
}

let definitionHistory = async () => {
	// console.log(mdictSelected.value);

	let result = await mdictEngine.lookup(searchWord.value);
	if (!result) {
		return;
	}

	mdictResult.value = await processMdictResult(result);
}

async function handleContainerClick(event: MouseEvent){
	
	const target = (event.target as HTMLElement).closest('a[href]');

	if (!target){

		return
	}

	else if (target.getAttribute('href')?.startsWith('entry://')) {
		event.preventDefault();
		const entryId = target.getAttribute('href')?.substring('entry://'.length);
		// console.log("Entry ID:", entryId);
		searchWord.value = entryId || '';
		await definition();

		// console.log("Entry link clicked:", target.getAttribute('href'));
		

		return;
	}
	else if (!target.getAttribute('href')?.startsWith('sound://')) {
		let tmp = await mdictEngine.lookup(target.getAttribute('href') || '');
		if (tmp) {
			mdictResult.value = await processMdictResult(tmp);
		}
		return;
	}

	event.preventDefault();
	const href = target.getAttribute('href');

	if (!href){
		return;
	}


	// handle sound link
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

	playAudio(soundData, soundType || 'mp3');

}

onMounted(() => {

	if (containerRef.value) {
		containerRef.value.addEventListener('click', handleContainerClick);
	}
	props.plugin.app.workspace.on('mdict:settings-updated', updateMdictData);

	// let mdxMddData = getMdxMddPaths(app.plugins.plugins['obsidian-mdict'].settings.mdictData[0].mdictFolderPath);
	// console.log("mdxMddData:", mdxMddData);

});

onUnmounted(() => {
	if (containerRef.value) {
		containerRef.value.removeEventListener('click', handleContainerClick);
	}
	props.plugin.app.workspace.off('mdict:settings-updated', updateMdictData);
});


watch(mdictResult, async () => {
	await nextTick();


});




</script>



<style>

* {
  -webkit-user-select: auto !important;
  -moz-user-select: inherit  !important;
  -ms-user-select: inherit  !important;
  user-select: auto  !important;
}

.toolbar {
  display: flex;
  flex-direction: column;  /* 預設直向 */
  gap: 10px;
  margin-bottom: 16px;
}

/* select 區塊 */
.dict-select label {
  margin-right: 8px;
  font-size: 14px;
  color: #555;
}

.dict-select select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
}

/* 搜尋列 */
.search-bar {
  display: flex;
  gap: 6px;
}

.search-bar input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-bar input:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.3);
}

.search-bar button {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background-color: #4a90e2;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.search-bar button:hover {
  background-color: #357ab7;
}

/* 左右箭頭專用樣式 */
.history-btn {
  background-color: #eee;
  color: #333;
  font-size: 16px;
  padding: 6px 10px;
  border: 1px solid #ccc;
}

.history-btn:hover {
  background-color: #ddd;
}


</style>
