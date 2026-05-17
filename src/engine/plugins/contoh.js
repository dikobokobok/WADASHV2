import { Innertube } from 'youtubei.js';
import pkg from 'jinter';
const { Jinter } = pkg;
import fs from 'fs';

// 1. Buat Wrapper Interpreter sesuai standar youtubei.js v17+
class NodeJSInterpreter {
  evaluate(code) {
    const jinter = new Jinter(code);
    return jinter.interpret();
  }
}

async function downloadYouTubeVideo() {
  try {
    // Masukkan link baru Anda di sini
    const videoUrl = 'https://youtu.be/iTJSbJtS8MU?si=Q3SFnMU15GTZPBuF';
    
    // Fungsi otomatis untuk mengambil ID Video dari URL (mengambil 'iTJSbJtS8MU')
    const videoId = videoUrl.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)[2]?.split(/[^0-9a-z_\-]/i)[0];
    
    if (!videoId) {
      throw new Error('Gagal mengekstrak ID Video dari URL yang diberikan.');
    }

    console.log('Menginisialisasi koneksi ke YouTube...');
    
    // 2. Hubungkan Jinter ke dalam instance Innertube
    const youtube = await Innertube.create({
      interpreter: new NodeJSInterpreter() 
    });

    console.log(`Mengambil data untuk video ID: ${videoId}...`);
    const videoInfo = await youtube.getInfo(videoId);

    console.log('\n--- Metadata Video ---');
    console.log('Judul Video:', videoInfo.basic_info.title);
    console.log('Channel:', videoInfo.basic_info.author);

    console.log('\nMemulai proses download...');
    
    // 3. Request download stream dengan client 'WEB' agar bypass cipher sukses
    const stream = await youtube.download(videoId, {
      type: 'video+audio', 
      quality: 'best',
      client: 'WEB'
    });

    const fileStream = fs.createWriteStream('video.mp4');
    
    // 4. Proses pemindahan chunk data stream ke file lokal
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
    }
    
    fileStream.end();
    console.log('\n Selesai! Video berhasil disimpan sebagai "video.mp4"');

  } catch (error) {
    console.error('\n[Proses Gagal] Terjadi kesalahan:', error.message);
  }
}

downloadYouTubeVideo();

//result
/**PS C:\Users\INU\Documents\a> node f.js
Menginisialisasi koneksi ke YouTube...
Mengambil data untuk video ID: iTJSbJtS8MU...
[YOUTUBEJS][Parser]: InnertubeError: HypeFanCreditsSectionView not found!
This is a bug, want to help us fix it? Follow the instructions at https://github.com/LuanRT/YouTube.js/blob/main/docs/updating-the-parser.md or report it at https://github.com/LuanRT/YouTube.js/issues!
Introspected and JIT generated this class in the meantime:
class HypeFanCreditsSectionView extends YTNode {
  static type = 'HypeFanCreditsSectionView';

  header: YTNodes.SectionHeaderView | null;

  constructor(data: RawNode) {
    super();
    this.header = Parser.parseItem(data.header, YTNodes.SectionHeaderView);
  }
}

    at ERROR_HANDLER (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:71:27)
    at createRuntimeClass (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/generator.js:320:5)
    at generateRuntimeClass (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/generator.js:371:21)
    at parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:401:17)
    at Module.parseArray (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:444:28)
    at new StructuredDescriptionContent (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/classes/StructuredDescriptionContent.js:20:29)
    at Module.parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:424:28)
    at new EngagementPanelSectionList (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/classes/EngagementPanelSectionList.js:22:31)
    at parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:424:28)
    at parseArray (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:444:28) {
  date: 2026-05-17T03:16:36.749Z,
  version: '17.0.1',
  info: undefined
}
[YOUTUBEJS][Parser]: ParsingError: Type mismatch, got HypeFanCreditsSectionView expected VideoDescriptionHeader | ExpandableVideoDescriptionBody | VideoDescriptionMusicSection | VideoDescriptionInfocardsSection | VideoDescriptionCourseSection | VideoDescriptionTranscriptSection | VideoDescriptionTranscriptSection | HorizontalCardList | ReelShelf | VideoAttributesSectionView | HowThisWasMadeSectionView | ExpandableMetadata | MerchandiseShelf.
    at ERROR_HANDLER (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:59:27)
    at parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:405:25)
    at Module.parseArray (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:444:28)
    at new StructuredDescriptionContent (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/classes/StructuredDescriptionContent.js:20:29)
    at Module.parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:424:28)
    at new EngagementPanelSectionList (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/classes/EngagementPanelSectionList.js:22:31)
    at parseItem (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:424:28)
    at parseArray (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:444:28)
    at Module.parseResponse (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/parser/parser.js:349:31)
    at new MediaInfo (file:///C:/Users/INU/Documents/a/node_modules/youtubei.js/dist/src/core/mixins/MediaInfo.js:26:45) {
  date: 2026-05-17T03:16:36.751Z,
  version: '17.0.1',
  info: { header: { sectionHeaderViewModel: [Object] } }
}

--- Metadata Video ---
Judul Video: aespa 에스파 'WDA (Whole Different Animal) (Feat. G-DRAGON)' MV
Channel: SMTOWN

Memulai proses download...

[Proses Gagal] Terjadi kesalahan: To decipher URLs, you must provide your own JavaScript evaluator. See https://ytjs.dev/guide/getting-started.html#providing-a-custom-javascript-interpreter for more details.
PS C:\Users\INU\Documents\a>  */