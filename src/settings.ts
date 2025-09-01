import Plugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import {View} from './view';


export const DEFAULT_SETTINGS: Settings = {
	mdictData: [{
		mdictName: '',
		mdictFolderPath: ''}],

};



export interface Settings{
	mdictData: Array<mdictData>;
}

export interface mdictData{
	mdictName: string;
	mdictFolderPath: string;
}

export class MdictSettingTab extends PluginSettingTab {
	plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		// console.log(this.plugin.settings.mdictDataPath);
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Mdict Data Path' });

		this.plugin.settings.mdictData.forEach((md, index) => {
			const s = new Setting(containerEl)
					.addText((cb) => {
						cb.setPlaceholder('Enter Mdict Folder Path')
							.setValue(md.mdictFolderPath)
							.onChange(async (value) => {
								let folderName = value.split('/').pop() || '';
								this.plugin.settings.mdictData[index] = {mdictName: folderName, mdictFolderPath: value};
							});
						
						cb.inputEl.addClass('mdict-path-input');
					
					})
					.addExtraButton(button => {
						button.setIcon('check')
							.setTooltip('Add new Mdict path')
							.onClick(async () => {
								await this.plugin.saveSettings();
								this.plugin.app.workspace.trigger('mdict:settings-updated');
								this.display(); // Refresh the settings display
							});
							
					})
					.addExtraButton(button => {
						button.setIcon('trash')
							.setTooltip('Remove this path')
							.onClick(async () => {
								this.plugin.settings.mdictData.splice(index, 1);
								await this.plugin.saveSettings();
								this.plugin.app.workspace.trigger('mdict:settings-updated');
								this.display(); // Refresh the settings display
							});
					});

			// s.infoEl.addClass('mdict-path-label');
			s.infoEl.remove();

		});


		new Setting(containerEl)
			.addButton(button => {
				button.setButtonText('Add New Mdict Path')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.mdictData.push({mdictName:"", mdictFolderPath:""});
						await this.plugin.saveSettings();
						this.plugin.app.workspace.trigger('mdict:settings-updated');
						this.display(); // Refresh the settings display
					});

			})



	}
}
