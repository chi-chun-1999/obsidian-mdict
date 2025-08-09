import {MDX, MDD} from 'js-mdict';


// const mdict = new MDX("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.mdx");

// const def = mdict.lookup("good");

export class MdictEngine {
	private mdict: MDX;
	private mddmdict: MDX;

	constructor(mdictPath: string) {
		this.mdict = new MDX(mdictPath);
		this.mddmdict = new MDD(mdictPath.replace(/\.mdx$/, '.mdd'));
	}

	lookup(word: string): string | null {
		const definition = this.mdict.lookup(word);
		return definition ? definition.definition : null;
	}
	lookupMdd(word: string): string | null {
		const definition = this.mddmdict.locate(word);
		return definition ? definition.definition : null;
	}

}

