import Plugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export const DEFAULT_SETTINGS: Settings = {
	mdictDataPath: [{
		mdictName: '',
		mdictFolderPath: ''}]

};


export interface Settings{
	mdictDataPath: Array<mdictData>;
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
		console.log(this.plugin.settings.mdictDataPath);
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Mdict Data Path' });

		this.plugin.settings.mdictDataPath.forEach((md, index) => {
			const s = new Setting(containerEl)
					.addText((cb) => {
						cb.setPlaceholder('Enter Mdict Folder Path')
							.setValue(md.mdictFolderPath)
							.onChange(async (value) => {
								let folderName = value.split('/').pop() || '';
								this.plugin.settings.mdictDataPath[index] = {mdictName: folderName, mdictFolderPath: value};
								await this.plugin.saveSettings();
							});
						
						cb.inputEl.addClass('mdict-path-input');
					
					})
					.addExtraButton(button => {
						button.setIcon('trash')
							.setTooltip('Remove this path')
							.onClick(async () => {
								this.plugin.settings.mdictDataPath.splice(index, 1);
								await this.plugin.saveSettings();
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
						this.plugin.settings.mdictDataPath.push({mdictName:"", mdictFolderPath:""});
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings display
					});

			})



	}
}
