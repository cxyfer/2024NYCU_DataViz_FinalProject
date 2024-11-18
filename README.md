# 常用網址
- [Paper Presentation Slide](https://www.canva.com/design/DAGVUDBWJcI/09AbL0vOT40OyPglCMbPKw/edit?utm_content=DAGVUDBWJcI&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
- [學長姐的 Repo](https://github.com/ting0602/DV_FinalProject)
- [討論用 Google Meet](https://meet.google.com/vtf-ngzy-exm)
- [報告用 Google Meet](https://meet.google.com/ppz-erus-jsb)

## Previous Work

- [LineBot-2021TWVoteStats](https://github.com/cxyfer/LineBot-2021TWVoteStats)

# 2024NYCU_DataViz_FinalProject

## Discussion

- [Proposal (HackMd)](https://hackmd.io/@xyf/BJudIwQZ1e)
- [ziteboard](https://app.ziteboard.com/team/b9bacfbc-91af-45fe-9ce6-d74e538fe45f&lang=TW)

---

# DataViz Final Project Proposal: 臺灣 2024 總統大選：視覺化各地區投票結果，結合收入階層和教育程度之複合分析

> [name=陳軒宇, 劉杰睿, 楊芊華]

## Introduction
本研究將聚焦於 2024 年臺灣總統大選，探討不同地區之投票結果與社經背景之間的關聯性，特別是收入階層與教育程度如何影響各候選人之支持度。透過資料視覺化技術，提供一個直觀的方式來分析不同區域在政治偏好上隨著收入和教育程度的變動。

## Methodology

### Heat Map 結合臺灣地圖

為了直觀地呈現 2024 年總統大選中各地區對於主要候選人的支持傾向，本研究將使用 D3.js 建立一個結合 Heat Map 並細緻至村里層級的臺灣地圖，以展示各地區的投票行為模式，並通過圈圈的大小來表達投票人數，呈現各地區對於主要候選人的支持傾向，提供對不同地區投票結果的深入理解。
    ![proposal_map_overview](https://hackmd.io/_uploads/rJ2UaO7bkg.jpg)

### 視覺化不同收入階層與教育程度人群的投票傾向

為了更深入探討收入和教育程度對選民投票行為的本研究將依據各村里的收入中位數和大學以上學歷人口比例進行排序，並以折線圖和柱狀圖分別展示累積投票比例和區間投票比例。

1. 以折線圖顯示依照指定標的排序後，村里之累積投票比例，並可以依照使用者需求，顯示特定區間 $[l, r]$ 之累積投票比例。
    ![cumulative_vote_share](https://hackmd.io/_uploads/HkegS_mbJx.png)
2. 以柱狀圖顯示依照指定標的排序後，以一定比例 ($10\%$) 為區間大小，該區間內村里之投票比例
    ![grouped_vote_share](https://hackmd.io/_uploads/Hkx1KuQZ1x.png)


## Contribution

本研究透過複合數據的分析，提供了一個具體的途徑來了解各地區選民的支持傾向，並探討收入與教育程度等因素對選舉投票行為的影響。這樣的洞察對未來選舉政策制定者、策略規劃者、和政治分析家具有指導意義，提供了選民行為的參考依據。

## Dataset
- [選舉資料庫](https://data.cec.gov.tw/選舉資料庫)
- [2024ー第16任總統副總統選舉](https://db.cec.gov.tw/ElecTable/Election/ElecTickets?dataType=tickets&typeId=ELC&subjectId=P0&legisId=00&themeId=4d83db17c1707e3defae5dc4d4e9c800&dataLevel=N&prvCode=00&cityCode=000&areaCode=00&deptCode=000&liCode=0000)
- [政府開放資料:各村里教育程度資料](https://scidm.nchc.org.tw/dataset/insight_classifiction_dataset_1_3/resource/9352e52d-016c-42b9-b343-b660ae04f476)
- [綜稅綜合所得總額全國各縣市鄉鎮村里統計分析表 ｜ 政府資料開放平臺](https://data.gov.tw/dataset/103066)
