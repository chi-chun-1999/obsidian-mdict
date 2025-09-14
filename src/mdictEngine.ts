import {MDX, MDD} from 'js-mdict';
import {spawn} from 'child_process';
import {PassThrough} from 'stream';
import ffmpeg from "fluent-ffmpeg";
import fs from 'fs';



// const mdict = new MDX("/Users/chi-chun/project/obsidian/dev-plug/.obsidian/plugins/obsidian-mdict/mdict/LDCE6/LongmanDictionaryOfContemporaryEnglish6thEnEn.mdx");

// const def = mdict.lookup("good");

export class MdictEngine {
	private mdict: MDX;
	private mddmdict: MDX;

	constructor(mdxMddData ) {
		// console.log('mdxMddData', mdxMddData);

		this.mdict = new MDX(mdxMddData.mdxPath);
		if (mdxMddData.mddPath)
			this.mddmdict = new MDD(mdxMddData.mddPath);
		else
			this.mddmdict = null;

	}
	

	lookup(word: string): string | null {
		const definition = this.mdict.lookup(word);
		return definition ? definition.definition : null;
	}
	lookupMdd(word: string): string | null {
		const definition = this.mddmdict.locate(word);
		return definition ? definition.definition : null;
	}

	fuzzyLookup(word: string): Array<string> {
		const results = this.mdict.fuzzy_search(word, 5, 10);
		return results.map(result => result.keyText);
	}



}

export async function spxBase64ToMp3Base64(spxBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const spxBuffer = Buffer.from(spxBase64, 'base64');

        const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', [
            '-y',           // overwrite output
            '-i', 'pipe:0', // input from stdin
			'-b:a', '51k',
			'-ar', '44100', // set audio sample rate to 44100 Hz
			'-ac', '1',     // set number of audio channels to 1 (mono)
            '-f', 'mp3',    // output format mp3
			'-q:a', '2', // set quality level (0-9, where 0 is best quality)
			'-acodec', 'libmp3lame', // specify codec
			'-af', 'silenceremove=window=0:detection=peak:stop_mode=all:start_mode=all:stop_periods=-1:stop_threshold=0:timestamp=copy', // resample audio to avoid issues
			'-fflags', '+genpts', // generate presentation timestamps
            'pipe:1'        // output to stdout
        ]);

        const outputChunks: Buffer[] = [];
        const errorChunks: Buffer[] = [];

        ffmpeg.stdout.on('data', (chunk: Buffer) => outputChunks.push(chunk));
        ffmpeg.stderr.on('data', (chunk: Buffer) => errorChunks.push(chunk));

        ffmpeg.on('close', (code: number) => {
            if (code === 0) {
                const mp3Buffer = Buffer.concat(outputChunks);
                resolve(mp3Buffer.toString('base64'));
            } else {
                reject(new Error(`FFmpeg failed: ${Buffer.concat(errorChunks).toString()}`));
            }
        });

        ffmpeg.stdin.write(spxBuffer);
        ffmpeg.stdin.end();
    });
}


export async function convertSpxBase64ToMp3Base64(spxBase64: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // base64 解碼成 Buffer
    const spxBuffer = Buffer.from(spxBase64, "base64");

    // 從 Buffer 建立可讀串流
    const inputStream = new PassThrough();
    inputStream.end(spxBuffer);

    // 收集 ffmpeg 輸出資料
    const outputChunks: Buffer[] = [];
    const outputStream = new PassThrough();

    outputStream.on("data", (chunk: Buffer) => {
      outputChunks.push(chunk);
    });

    outputStream.on("end", () => {
      const mp3Buffer = Buffer.concat(outputChunks);
      const mp3Base64 = mp3Buffer.toString("base64");
      resolve(mp3Base64);
    });

	ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg'); // 確保 ffmpeg 路徑正確

    // 執行 ffmpeg 轉檔
    ffmpeg(inputStream)
      .inputFormat("ogg")        // speex 通常在 ogg 容器內
      .audioChannels(1)          // 單聲道
      .audioFrequency(44100)     // 可根據實際來源調整
      .format("mp3")
      .audioBitrate("64k")
      .on("error", (err: Error) => {
        reject(err);
      })
      .on("end", () => {
        outputStream.end();
      })
      .pipe(outputStream, { end: true });
  });
}



// export function playSpxBase64(spxBase64: string) {
//     const spxBuffer = Buffer.from(spxBase64, 'base64');
//
//     // Spawn ffmpeg to decode SPX → PCM
//     const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', [
//         '-i', 'pipe:0',
//         '-f', 's16le', // signed 16-bit little-endian PCM
//         '-ar', '16000', // sample rate
//         '-ac', '1',     // mono
// 		'-acodec', 'speex', // specify codec
//         'pipe:1'
//     ]);
//
//     // Create speaker instance
//     const speaker = new Speaker({
//         channels: 1,
//         bitDepth: 16,
//         sampleRate: 16000
//     });
//
//     ffmpeg.stdout.pipe(speaker);
//
//     // Write SPX data to ffmpeg stdin
//     ffmpeg.stdin.write(spxBuffer);
//     ffmpeg.stdin.end();
// }
