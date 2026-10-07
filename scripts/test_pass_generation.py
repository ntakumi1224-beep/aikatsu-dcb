"""Synthetic values exist only in this test; neither workbook nor output JSON is written."""
import importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('master',root/'scripts/build_card_master.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
source=root/'card_date/aikatsu_dcb_master_verified_2026-10-07.xlsx'
headers,rows=m.read_master(source)
for _,raw in rows:
 if raw.get('カード種別')=='アイカツパス（データセーブカード）':raw['コーデ名']='オーロラキスコーデ';raw['schoolName']='テスト用学校名';raw['passDesign']='テスト用デザイン';raw['motif']='テスト用モチーフ'
m.read_master=lambda _: (headers,rows)
cards,coordinates,report=m.convert(source)
passes=[c for c in cards if c['cardKind']=='アイカツパス（データセーブカード）']
assert len(passes)==2 and all(not c['coordinateId'] for c in passes)
assert all(c['schoolName']=='テスト用学校名' and c['passDesign']=='テスト用デザイン' and c['motif']=='テスト用モチーフ' for c in passes)
assert all(next(c for c in cards if c['id']==id)['cardKind']=='ドレスカード' for co in coordinates for id in co['cardIds'])
assert sum(report['dressCategoryCounts'].values())==137 and 'アイカツパス' not in report['dressCategoryCounts']
print('PASS: named passes cannot enter dress coordinates; future optional school/design/motif columns are preserved; dress category counts exclude passes.')
