"""Independent read-only XLSX/JSON reconciliation using bundled openpyxl."""
import hashlib,json,sys
from pathlib import Path
import openpyxl
root=Path(__file__).resolve().parents[1];source=root/'card_date/aikatsu_dcb_master_verified_2026-10-07.xlsx';before=hashlib.sha256(source.read_bytes()).hexdigest();wb=openpyxl.load_workbook(source,read_only=True,data_only=True);rows=list(wb['全カード'].iter_rows(values_only=True));headers=rows[0];raw=[dict(zip(headers,[str(v) if v is not None else '' for v in row])) for row in rows[1:] if any(v is not None for v in row)];cards=json.loads((root/'data/cards.json').read_text(encoding='utf-8'));assert len(raw)==len(cards)==139;assert len({c['id'] for c in cards})==139
for r,c in zip(raw,cards):assert r==c['raw'],c['id'];assert r['仮内部ID']==c['id'];assert r['公式カード番号']==c['cardNumber'];assert r['通常／パラレル等の仕様']==c['specification'];assert c['ownedCount']==0 and not c['favorite'];assert not c['id'].startswith('bloom') and not c['cardNumber'].startswith('DEMO-')
wb.close();assert before==hashlib.sha256(source.read_bytes()).hexdigest();print('PASS: all 139 Excel rows x 35 columns equal JSON raw fields; IDs unique; no dummy rows or seeded ownership; XLSX unchanged.')
