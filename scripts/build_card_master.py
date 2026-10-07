"""Convert only the verified workbook's 全カード sheet. XLSX remains read-only.
Python standard library only; unknown source values remain intact.
"""
import argparse,collections,hashlib,json,posixpath,re,sys,zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
FIELDS={'仮内部ID':'id','公式カード番号':'cardNumber','カード名':'name','シリーズ／弾':'release','レアリティ':'rarity','タイプ':'type','ブランド':'brand','カテゴリ':'category','キャラクター':'character','コーデ名':'coordinateName','通常／パラレル等の仕様':'specification','入手区分':'acquisition','具体的な入手方法':'acquisitionMethod','配布／登場開始日':'startDate','配布終了日':'endDate','対象店舗／イベント／商品名':'target','入手条件':'conditions','備考':'notes','確認状態':'verificationStatus','提供状況':'availability','カード種別':'cardKind','公式画像確認URL':'officialImageURL','主要出典URL':'primarySourceURL','追加出典URL':'additionalSourceURLs','情報確認日':'verifiedDate','日付精度':'datePrecision','監査判定':'auditDecision','対応通常版ID':'normalVersionId','コーデ名の扱い':'coordinateStatus'}
OPTIONAL_FIELDS={'schoolName':['schoolName','学校名'],'passDesign':['passDesign','デザイン名'],'motif':['motif','モチーフ']}
COLORS={'キュート':'#ff62a7','クール':'#298dde','セクシー':'#a563d8','ポップ':'#eb891f'}
ACQUISITION={'通常排出':'game','パラレル排出':'game','ロケーションテスト排出':'game','イベント／キャンペーン配布':'distribution','キャンペーン配布':'distribution','イベント／店頭配布':'distribution','雑誌付録':'supplement','店舗／通販購入特典':'bonus','商品付属':'bonus','店舗購入特典':'bonus','コンビニキャンペーン':'bonus'}
def read_master(file):
 with zipfile.ZipFile(file) as z:
  strings=[''.join(t.text or '' for t in x.findall('.//m:t',NS)) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
  rel={x.attrib['Id']:x.attrib['Target'] for x in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  sheet=next(s for s in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS) if s.attrib['name']=='全カード')
  target=rel[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']];target=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
  rows=[]
  for row in ET.fromstring(z.read(target)).findall('.//m:sheetData/m:row',NS):
   values={}
   for cell in row:
    v=cell.find('m:v',NS);value=v.text or '' if v is not None else ''.join(t.text or '' for t in cell.findall('.//m:t',NS))
    if cell.attrib.get('t')=='s':value=strings[int(value)]
    if cell.find('m:f',NS) is not None:raise ValueError('Formula source requires explicit review at '+cell.attrib['r'])
    values[re.sub(r'\d+$','',cell.attrib['r'])]=value
   rows.append((int(row.attrib['r']),values))
  headers=rows[0][1]
  if len(set(headers.values()))!=len(headers):raise ValueError('Duplicate columns')
  if set(FIELDS)-set(headers.values()):raise ValueError('Required columns missing')
  return headers,[(r,{name:v.get(col,'') for col,name in headers.items()}) for r,v in rows[1:]]
def convert(file):
 headers,rows=read_master(file);cards=[];blank=[];groups={};ids=set()
 for row,raw in rows:
  if not any(raw.values()):blank.append(row);continue
  c={key:raw[label] for label,key in FIELDS.items()}
  for key,labels in OPTIONAL_FIELDS.items():
   for label in labels:
    if label in raw:c[key]=raw[label];break
  if not re.fullmatch(r'DCB-\d+',c['id']):raise ValueError('Invalid or missing ID at row '+str(row))
  if c['id'] in ids:raise ValueError('Duplicate ID '+c['id'])
  ids.add(c['id'])
  if not c['name']:raise ValueError('Missing card name '+c['id'])
  c.update(series=c['release'],raw=raw,sourceRow=row,tradeRarity='parallel' if 'パラレル' in c['specification'] else {'PR':'premium','ER':'encore','R':'rare','N':'normal'}.get(c['rarity'],None),acquisitionType=ACQUISITION.get(c['acquisition']),color=COLORS.get(c['type'],'#a5aab3'),image=None,ownedCount=0,favorite=False,memo='',coordinateId='',scanVariant=c['specification'])
  if c['acquisitionType'] is None:raise ValueError('Unmapped acquisition: '+c['acquisition'])
  # Keep exact source numbers, including blanks. Match only nonempty official numbers.
  c['scanNumbers']=[]
  name=c['coordinateName']
  # Use the Master name, including provisional names. Passes marked 該当なし have no coordinate.
  if c['cardKind']=='ドレスカード' and name.strip() and name not in ['未確認','該当なし']:
   groups.setdefault(name,[]).append(c)
  cards.append(c)
 coordinates=[];order={'トップス':0,'トップス&ボトムス':0,'ボトムス':1,'シューズ':2,'アクセサリー':3,'フルコーデ':0}
 for name,items in groups.items():
  key=json.dumps(name,ensure_ascii=False);id_='CO-'+hashlib.sha256(key.encode()).hexdigest()[:12]
  items.sort(key=lambda c:(order.get(c['category'],9),c['cardNumber'],c['id']))
  for c in items:c['coordinateId']=id_
  first=items[0];coordinates.append(dict(id=id_,name=name,masterName=name,type=first['type'],brand=first['brand'],character=first['character'],release=first['release'],series=first['series'],rarity=first['rarity'],acquisition=first['acquisition'],color=first['color'],concept='',specification='',cardIds=[c['id'] for c in items]))
 numbers=collections.defaultdict(list)
 for c in cards:
  if c['cardNumber']:numbers[c['cardNumber']].append(c['id'])
 report={'sourceFile':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sheet':'全カード','columns':list(headers.values()),'excelValidRows':len(cards),'cards':len(cards),'coordinates':len(coordinates),'coordinateNameStats':{'uniqueConcreteNames':len(groups),'generatedGroups':len(coordinates),'unconfirmedCards':sum(c['coordinateName']=='未確認' for c in cards),'blankCards':sum(not c['coordinateName'].strip() for c in cards),'notApplicableCards':sum(c['coordinateName']=='該当なし' for c in cards)},'blankFormattedRows':blank,'excludedValidRows':[],'duplicateIds':[],'duplicateOfficialNumbers':{n:v for n,v in numbers.items() if len(v)>1},'blankOfficialNumbers':[c['id'] for c in cards if not c['cardNumber']],'missingNames':[],'coordinateExcluded':[c['id'] for c in cards if not c['coordinateId']],'dressCategoryCounts':dict(collections.Counter(c['category'] for c in cards if c['cardKind']=='ドレスカード')),'cardKinds':dict(collections.Counter(c['cardKind'] for c in cards)),'distributions':{key:dict(collections.Counter(c[key] for c in cards)) for key in ['rarity','type','brand','category','acquisition','acquisitionType','tradeRarity','verificationStatus','coordinateStatus']},'officialImageURLCount':sum(bool(c['officialImageURL']) for c in cards),'directImageURLCount':sum(bool(re.search(r'\.(webp|png|jpe?g)(\?|$)',c['officialImageURL'],re.I)) for c in cards),'defaultOwnership':0}
 return cards,coordinates,report
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('xlsx',nargs='?',default=str(ROOT/'card_date/aikatsu_dcb_master_verified_2026-10-07.xlsx'));args=parser.parse_args();file=Path(args.xlsx)
 if 'verified' not in file.name:raise ValueError('Use the verified Master workbook')
 cards,coordinates,report=convert(file);out=ROOT/'data';out.mkdir(exist_ok=True)
 for name,data in [('cards',cards),('coordinates',coordinates),('master-audit',report)]:
  dest=out/(name+'.json');temp=out/(name+'.json.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(dest)
 if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
 print(f'Master: {len(cards)} cards, {len(coordinates)} coordinate groups; blank rows={report["blankFormattedRows"]}; valid rows excluded=0')
