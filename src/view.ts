import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';
import { Settings } from './settings';
import {MdictPlugin} from './main';

export const VIEW_TYPE: string = 'my-view';

export class View extends ItemView {
    vueapp: VueApp;
	// settings: Settings;
	plugin: MdictPlugin;
    constructor(leaf: WorkspaceLeaf, plugin:MdictPlugin) {
        super(leaf);
		this.plugin = plugin;
		// this.settings = settings;
		// console.log('-->',settings.mdictDataPath);
    }
    getViewType(): string {
        return VIEW_TYPE;
    }
    getDisplayText(): string {
        return "Vue Stater";
    }
    getIcon(): string {
        return "book";
    }
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        let content = container.createEl("div", {
            cls: "my-plugin-view"
        });

        this.vueapp = createApp(App, {
			settings: this.plugin.settings,
			plugin: this.plugin,
		});
        this.vueapp.mount(content);
    }
    async onClose() {
        this.vueapp.unmount();
    }
	updateSettings(mdictData: Settings) {
		this.vueapp.config.globalProperties.$settings = mdictData;
	}

}
