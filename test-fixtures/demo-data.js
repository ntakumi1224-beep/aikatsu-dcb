window.DCBData=(()=>{
const concepts=[['bloom','ブルーミングリボン','Ribbon Garden','キュート','花咲あかり','#e779a1','花とリボンで彩る、春のステージ。',4],['lunar','ルナティックブルー','Lunar Atelier','クール','月城しおり','#7d91d5','月明かりをまとった静かなきらめき。',4],['sunny','サニーキャンディ','Candy Parade','ポップ','陽向ひなた','#e6b84a','キャンディカラーで元気を届けよう。',4],['violet','バイオレットジュエル','Violet Room','セクシー','紫乃すみれ','#ac84c5','宝石の輝きを集めた特別な一着。',3],['mint','ミントティーパーティー','Ribbon Garden','キュート','花咲あかり','#62bba6','午後のお茶会にさわやかなミントを。',3],['star','スターダストナイト','Lunar Atelier','クール','月城しおり','#7d91d5','星をつないで夜空に描くステージ。',3],['peach','ピーチスパークル','Candy Parade','ポップ','陽向ひなた','#e779a1','フルーツみたいに弾ける甘いきらめき。',3]];
const categories=['トップス','ボトムス','シューズ','アクセサリー'];
const coordinates=concepts.map((c,i)=>({id:c[0],name:c[1]+'コーデ',brand:c[2],type:c[3],character:c[4],color:c[5],concept:c[6],cardIds:Array.from({length:c[7]},(_,j)=>c[0]+'-'+j),release:i<4?'第1弾':'第2弾',series:i<4?'Blooming Stage':'Dreaming Stage',acquisition:i<4?'通常排出':'イベント配布',rarity:i<4?'PR':'R'}));
const cards=coordinates.flatMap((co,i)=>co.cardIds.map((id,j)=>({id,cardNumber:'DEMO-'+String(i*4+j+1).padStart(3,'0'),name:concepts[i][1]+' '+categories[j],rarity:co.rarity,category:categories[j],character:co.character,brand:co.brand,type:co.type,release:co.release,series:co.series,coordinateId:co.id,acquisition:co.acquisition,color:co.color,image:null,ownedCount:(i+j)%3===0?0:(i+j)%4===0?3:1,favorite:i===0&&j<2,memo:''})));
// Test-only scan aliases; existing DEMO numbers and inventory IDs stay unchanged.
cards.forEach((card,index)=>{card.scanNumbers=[`${index<12?'01':'02'}-${String(index%12+1).padStart(3,'0')}`];});
cards[0].scanNumbers.push('PR-001');cards[15].scanNumbers.push('PR-001');
cards[0].scanVariant='通常仕様（テスト）';cards[15].scanVariant='再録仕様（テスト）';
// Fixed acquisition categories. Dates are used only for sorting, never displayed.
const newsCategories={
 game:{label:'ゲーム',color:'var(--color-pink)'},
 distribution:{label:'配布',color:'var(--color-blue)'},
 supplement:{label:'付録',color:'var(--color-orange)'},
 bonus:{label:'特典',color:'var(--color-purple)'}
};
const news=[
 {id:'new-game-cards',date:'2026-10-07',acquisitionType:'game',title:'新弾カードが登場！',body:'新しい弾のカードがゲーム筐体から入手できる想定です。UI確認用の架空情報です。実際の登場日・排出期間は設定していません。'},
 {id:'store-distribution',date:'2026-10-06',acquisitionType:'distribution',title:'店頭で限定カードを配布',body:'店頭で限定カードを直接配布する想定です。UI確認用の架空情報です。実際の店舗・配布期間・配布条件は設定していません。'},
 {id:'magazine-card',date:'2026-10-05',acquisitionType:'supplement',title:'今月号にPRカードが付属',body:'雑誌にPRカードが付録として付く想定です。UI確認用の架空情報です。実際の商品名や発売情報ではありません。'},
 {id:'purchase-bonus',date:'2026-10-04',acquisitionType:'bonus',title:'対象商品購入で限定カードをプレゼント',body:'対象商品の購入条件を満たすと限定カードを入手できる想定です。UI確認用の架空情報です。実在の購入特典ではありません。'}
];
return {cards,coordinates,news,newsCategories};})();

