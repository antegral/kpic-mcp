## 목표
너는 지금부터 LLM 에이전트에 붙일 MCP (Model Context Protocol) Server를 만들어야 한다.
제시한 함수들을 구현해서 MCP 서버를 Typescript로 만들고, 테스트까지 수행하라.

목표는 약학정보원 API를 통해 의약품의 정보를 성공적으로 가져오는 것이다.

또한, 항상 Best practice를 기반으로 코드를 작성한다.
구현해야 할 Function은 다음과 같다.

### `search_drugs_by_name()`
```typescript
/*
약학정보원에서 의약품 이름으로 대략적인 정보들을 가져온다.
또한, 이름이 유사한 의약품 여러개가 나올 수 있다.

대략적인 정보들을 가져오므로 더 자세한 정보가 필요하다면 get_drug_detail_by_id()로 조회해야 한다.

:param drugname: 검색할 의약품의 이름, 영문 또는 한글이여야 함
*/
search_drugs_by_name(drugname: string): string
```

다음 TypeScript 코드로 의약품 코드를 기반으로 의약품의 상세정보를 가져온다.
```typescript
// HTTP 요청
const now: number = parseInt(Date.now())
fetch(`https://www.health.kr/searchDrug/ajax/ajax_commonSearch.asp?search_word=${drugcode}&search_flag=all&_=${now}`, {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko,en-US;q=0.9,en;q=0.8,ru;q=0.7",
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://www.health.kr/searchDrug/search_total_result.asp"
  },
  "body": null,
  "method": "GET"
});
```

HTTP 요청 성공시 응답은 다음과 같다.
```json
[
  {
    "pack_img": "",
    "drug_pic": "https://common.health.kr/shared/images/sb_photo/big3/201306280000401.jpg",
    "drug_name": "가스딘정2mg",
    "drug_enm": "Gasdin Tab. 2mg",
    "drug_code": "2013062800004",
    "sunb_count": 1,
    "list_sunb_name": "Irsogladine Maleate 2mg",
    "ingr_mg": "Irsogladine Maleate　2mg@",
    "dosage": "하기 질환별로 다음과 같이 사용한다. 단, 증상에 따라 적절히 증감한다.br<P></P>1) 위궤양br<P></P>  (성인) 이르소글라딘말레산염으로서 4mg, 1일 1회 경구 투여한다.br<P></P>2) 하기 질환의 위점막 병변(미란, 출혈, 발적, 부종)의 개선 : 급성 위염, 만성 위염의 급성 악화기br<P></P>  (성인) 이르소글라딘말레산염으로서 4mg, 1일 1∼2회 분할 경구 투여한다.",
    "effect": "1) 위궤양br<P></P>2) 하기 질환의 위점막병변(미란, 출혈, 발적, 부종)의 개선 : 급성위염 및 만성위염의 급성악화기",
    "upso_name_kfda": "영진약품",
    "cls_code": "232",
    "drug_form": "정제",
    "drug_class": "전문",
    "etc": "생동인정품목",
    "produce": "O",
    "boh_price": "141원/1정",
    "total_cnt": 2,
    "kfda_code": "201307888",
    "confirm_flag": "1"
  },
  {
    "pack_img": "",
    "drug_pic": "",
    "drug_name": "가스딘정4mg",
    "drug_enm": "Gasdin Tab. 4mg",
    "drug_code": "2019041800056",
    "sunb_count": 1,
    "list_sunb_name": "Irsogladine Maleate 4mg",
    "ingr_mg": "Irsogladine Maleate　4mg@",
    "dosage": "하기 질환별로 다음과 같이 사용한다. 단, 증상에 따라 적절히 증감한다.br<P></P>br<P></P>1) 위궤양br<P></P>(성인) 이르소글라딘말레산염으로서 4mg, 1일 1회 경구 투여한다.br<P></P>br<P></P>2) 하기 질환의 위점막 병변(미란, 출혈, 발적, 부종)의 개선 : 급성 위염, 만성 위염의 급성 악화기br<P></P>(성인) 이르소글라딘말레산염으로서 4mg, 1일 1∼2회 분할 경구 투여한다.",
    "effect": "1) 위궤양br<P></P>2) 하기 질환의 위점막병변(미란, 출혈, 발적, 부종)의 개선 : 급성위염 및 만성위염의 급성악화기",
    "upso_name_kfda": "영진약품",
    "cls_code": "232",
    "drug_form": "정제",
    "drug_class": "전문",
    "etc": "생동인정품목",
    "produce": "",
    "boh_price": "179원/1정",
    "total_cnt": 2,
    "kfda_code": "201902338",
    "confirm_flag": "1"
  }
]
```

### `get_drug_detail_by_id()`
```typescript
/*
약학정보원의 의약품 코드로 의약품의 상세정보를 가져온다.
search_drugs_by_name()로 조회한 정보가 부족할 때 사용할 수 있다.

:param drugcode: get_drags_by_name()의 결과 값에 기재된 의약품의 `drug_code` 값
*/
get_drug_detail_by_id(drugcode: string): string
```

다음 TypeScript 코드로 의약품 코드를 기반으로 의약품의 상세정보를 가져온다.
```typescript
// HTTP 요청
const now: number = parseInt(Date.now())
fetch(`https://www.health.kr/searchDrug/ajax/ajax_result_drug2.asp?drug_cd=${drugcode}&_=${now}`, {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "ko,en-US;q=0.9,en;q=0.8,ru;q=0.7",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "Referer": `https://www.health.kr/searchDrug/result_drug.asp?drug_cd=${drugcode}`
  },
  "body": null,
  "method": "GET"
});
```

HTTP 요청 성공시 응답은 다음과 같다.
```json
[
  {
    "idx": 73363,
    "drug_code": "2013062800004",
    "drug_name": "가스딘정2mg",
    "drug_enm": "Gasdin Tab. 2mg",
    "noins": null,
    "narcotic_kind_code": " ",
    "list_sunb_name": "Irsogladine Maleate 2mg",
    "cls_code_num": "232",
    "sunb": "<a href=\"/searchIngredient/detail.asp?ingd_code=I005004\">Irsogladine Maleate　이르소글라딘말레산염　2mg</a>@",
    "drug_cls": "1",
    "sunb_count": 1,
    "upso_name": "영진약품|YUNGJIN PHARM|(134-864) 서울특별시 강동구 천호3동 451-20|02) 2041-8200, 8282|02) 2041-8219|http://www.yungjin.co.kr",
    "upso1": "영진약품|YUNGJIN PHARM|(134-864) 서울특별시 강동구 천호3동 451-20|02) 2041-8200, 8282|02) 2041-8219|http://www.yungjin.co.kr",
    "drug_form": "정제",
    "dosage_route": "경구(내용고형)",
    "charact": "흰색의 원형 정제",
    "charact_new": "흰색의 원형 정제",
    "cls_code": "소화성궤양용제",
    "atc_cd": "",
    "boh_history": "642403700|141원/1정  급여 (2020-07-01)^642403700|141원/1정  급여 (2017-02-01)",
    "boh_hiracode": "642403700",
    "item_permit_date": "20130627",
    "cancel_date": "0",
    "newdrug_class_code": "N",
    "bioeq_prodt_yn": "Y",
    "comp_drug_yn_biology": "N",
    "comp_drug_yn_effect": "N",
    "comp_drug_yn": "N",
    "comp_drug_yn_physicochemical": "N",
    "kpic_atc": "Irsogladine Maleate : <a href=\"/renewal/searchIngredient/KPICeffect.asp?kpic_atc_cd=B\">소화기계질환</a> >  <a href=\"/renewal/searchIngredient/KPICeffect.asp?kpic_atc_cd=B01\">소화성궤양 치료제</a> >  <a href=\"/renewal/searchIngredient/KPICeffect.asp?kpic_atc_cd=B01D\">점막보호제</a> >  <a href=\"/renewal/searchIngredient/KPICeffect.asp?kpic_atc_cd=B01DZ\">기타</a>",
    "kpic_atc_cd": "B01DZ08",
    "insertpaper": "/images/insert_pdf/IN_2013062800004_00.pdf",
    "paper_dt": "2013-10-10",
    "dur_age": "",
    "dur_contra": "",
    "dur_preg": "Irsogladine : 2등급 , 명확한 임상적 근거 또는 사유가 있는 경우 부득이하게 사용",
    "dur_senior": "",
    "dur_dose": "",
    "dur_period": "",
    "dur_donate": "",
    "dur_form": "",
    "fdacode": "",
    "fdacontent": "",
    "sunbcontent": "Irsogladine Maleate|자료없음||#",
    "drug_box": "30정/병, 300정/병",
    "stmt": "기밀용기, 실온(1~30℃)보관",
    "drug_pic": "|https://common.health.kr/shared/images/sb_photo/big3/201306280000401.jpg",
    "pack_img": "",
    "picto_img": "https://common.health.kr/shared/images/pictogram/black/kor/E06.jpg|https://common.health.kr/shared/images/pictogram/black/kor/F01.jpg|https://common.health.kr/shared/images/pictogram/black/kor/I04.jpg",
    "medititle": "위점막을 보호하고, 손상된 점막조직의 재생을 촉진하는 약입니다.",
    "mediguide": "- 발진, 발적, 가려움증 등의 증상이 나타날 경우 전문가와 상의하세요.brbr- 과량으로 투여하지 않도록 주의하세요.brbr- 위에 자극을 줄 수 있는 강한 향신료, 카페인 등의 섭취는 삼가세요.",
    "effect": "1) 위궤양brbr<P></P>2) 하기 질환의 위점막병변(미란, 출혈, 발적, 부종)의 개선 : 급성위염 및 만성위염의 급성악화기",
    "dosage": "하기 질환별로 다음과 같이 사용한다. 단, 증상에 따라 적절히 증감한다.brbr<P></P>1) 위궤양brbr<P></P>  (성인) 이르소글라딘말레산염으로서 4mg, 1일 1회 경구 투여한다.brbr<P></P>2) 하기 질환의 위점막 병변(미란, 출혈, 발적, 부종)의 개선 : 급성 위염, 만성 위염의 급성 악화기brbr<P></P>  (성인) 이르소글라딘말레산염으로서 4mg, 1일 1∼2회 분할 경구 투여한다.",
    "caution": "[허가사항변경(재심사), 의약품관리총괄과-7837, 2013.11.19]\r\n<P></P>\r\n<P></P>1. 다음 환자에는 투여하지 말 것\r\n<P></P> 이 약은 유당을 함유하고 있으므로, 갈락토오스 불내성(galactose intolerance), Lapp 유당분해효소 결핍증(Lapp lactase deficiency) 또는 포도당-갈락토오스 흡수장애 (glucose-galactose malabsorption) 등의 유전적인 문제가 있는 환자에게는 투여하면 안 된다.\r\n<P></P>\r\n<P></P>2. 이상반응\r\n<P></P>1) 일본에서 실시된 재심사 종료시까지의 결과, 총 증례 10,176례 중 64례(0.63％)에서 임상검사치의 이상을 포함한 이상반응이 인정되고, 주된 이상반응은 간기능 이상 12건(0.12%), ALT(GPT) 상승 12건(0.12%), AST(GOT) 상승 7건(0.07%), 변비 6건(0.06%), 발진 5건(0.05%), 소양감, 설사, ALP 상승 각 3건(0.03%) 이었다.\r\n<P></P>\r\n<P></P>[&C1]\r\n<P></P>＊투여를 중지할 것\r\n<P></P>\r\n<P></P>그 밖에 추가로 어지러움, 졸음, 복부팽만감, 식욕부진, 구갈, 혈청 Cl 상승, 백혈구 증가, BUN의 경미한 상승, 총 빌리루빈의 경미한 상승, 잠혈 양성 등의 이상반응이 드물게 발견되었다.\r\n<P></P>\r\n<P></P>2) 국내 시판 후 조사 결과국내에서 재심사를 위하여 6년동안 3,462명을 대상으로 실시한 사용성적조사결과 유해사례의 발현율은 인과관계와 상관없이 1.16%(40/3,462명)[50건]로 보고되었고, 이 중 이 약과 인과관계를 배제할 수 없는 약물유해반응 발현율은 0.23%(8/3,462명)[12건]으로 오심 3명(0.09%, 3건), 구토 2명(0.06%, 2건), 설사, 소화불량, 식욕부진, 상복부통, 역류성식도염, SGPT증가, SGOT증가 각 1명(0.03%, 1건)으로 보고되었다.\r\n<P></P>중대한 유해사례는 인과관계와 상관없이 식욕부진, 십이지장염, 혈변, 급성담낭염, 담관암, 악성신생물악화, 두근거림, 뇌전이 각 1명(0.03%, 1건)으로 보고되었다.\r\n<P></P>예상하지 못한 유해사례는 인과관계와 상관없이 가슴쓰림 6명(0.17%, 6건), 소화불량 3명(0.09%, 3건), 십이지장염 2명(0.06%, 2건), 상복부통, 역류성식도염, 토혈, 트림, 급성담낭염, 지방간, 담관암, 악성신생물악화, 복통, 부종, 기침악화, 상기도감염, 뇌전이, 관절이상, 두근거림, 두통 각 1명(0.03%, 1건)으로 보고되었다.\r\n<P></P>\r\n<P></P>3. 고령자에 대한 투여\r\n<P></P>일반적으로 고령자는 생리 기능이 저하되어 있어 저용량(예를 들면 2mg/day)부터 투여를 하는 등, 환자의 상태를 관찰하면서 신중히 투여한다.\r\n<P></P>\r\n<P></P>4. 임부 및 수유부에 대한 투여\r\n<P></P>1) 임부 또는 임신하고 있을 가능성이 있는 부인에게는 치료 상의 유익성이 위험성을 상회한다고 판단되는 경우에만 투여한다.(임신 중의 투여에 대한 안전성은 확립되어 있지 않다.)\r\n<P></P>2) 동물시험에서 유즙으로의 이행이 약간 일어난다고 보고되었으므로, 수유중인 부인에게는 투여를 피하는 것이 바람직하다. 또한 부득이하게 투여하는 경우에는 수유를 중단한다. \r\n<P></P>\r\n<P></P>5. 소아에 대한 투여\r\n<P></P>소아에 대한 안전성은 확립되어 있지 않다. (사용경험이 적다.)\r\n<P></P>\r\n<P></P>6. 보관 및 취급상의 주의\r\n<P></P>1) 어린이의 손이 닿지 않는 곳에 보관한다.\r\n<P></P>2) 다른 용기에 바꾸어 넣는 것은 사고 원인이 되거나 품질유지면에서 바람직하지 않으므로 주의한다.\r\n<P></P>\r\n<P></P>7. 기타\r\n<P></P>1) 건강한 사람에 있어서 이 약물의 혈장으로부터의 소실반감기는 약 150시간이다.\r\n<P></P>2) 랫트를 이용한 생식독성시험결과 임신전ㆍ임신초기 경구투여시 30mg/kg/day에서 교미율의 저하경향이 나타났으며, 주산ㆍ수유기 시험에서 8mg/kg/day 이상을 경구투여시 출행자의 생존율 저하, 30mg/kg/day 투여시 출생자 체중억제가 나타났다.\r\n<P></P>3) 동물을 이용한 발암성시험은 수행되지 않았다.",
    "idfylength": "7|7|2.6|흰색의 원형 정제|YJ\r\nGDN2||29737|20475|2013062800004|||등록|등록완료|2013-08-28",
    "boh": "141원/1정",
    "etc": "생동인정품목",
    "idfyidx": 29737,
    "reexam": null,
    "reexam_start_date": "",
    "reexam_end_date": "",
    "item_ingr_type": "1",
    "additives": "스테아르산마그네슘</br>옥수수전분</br>유당수화물</br>저치환히드록시프로필셀룰로오스</br>콜로이드성이산화규소</br>탤크</br>폴리비닐알코올"
  }
]
```


