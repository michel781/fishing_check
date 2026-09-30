import { describe, expect, it } from "vitest";
import { mapSearchLinks, parseKakao, parseNaver } from "./shops";

describe("근처 낚시점", () => {
  it("카카오: 낚시용품점만, 낚시터·카페 제외, 거리 km", () => {
    const r = parseKakao([
      { id: "1", place_name: "신진도낚시", category_name: "가정,생활 > 스포츠용품 > 낚시용품", phone: "041-000-0000", road_address_name: "충남 태안군 근흥면", address_name: "", x: "126.13", y: "36.67", distance: "850", place_url: "http://place.map.kakao.com/1" },
      { id: "2", place_name: "바다좌대 낚시터", category_name: "스포츠,레저 > 낚시 > 낚시터", phone: "", road_address_name: "", address_name: "", x: "1", y: "1", distance: "900", place_url: "" },
      { id: "3", place_name: "행복마트", category_name: "가정,생활 > 슈퍼마켓", phone: "", road_address_name: "", address_name: "", x: "1", y: "1", distance: "100", place_url: "" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: "신진도낚시", km: 0.9, phone: "041-000-0000", url: "https://place.map.kakao.com/1" });
  });
  it("네이버: 태그 제거·WGS84 좌표·20km 이내", () => {
    const r = parseNaver(
      [
        { title: "<b>격포</b>낚시", category: "스포츠,오락>낚시용품", telephone: "", roadAddress: "전북 부안군 변산면", address: "", mapx: "1265300000", mapy: "356200000", link: "https://example.com" },
        { title: "먼낚시", category: "스포츠,오락>낚시용품", telephone: "", roadAddress: "서울", address: "", mapx: "1270000000", mapy: "375000000", link: "" },
      ],
      { lat: 35.62, lon: 126.47 },
    );
    expect(r.map((s) => s.name)).toEqual(["격포낚시"]);
    expect(r[0].km).toBeLessThan(10);
  });
  it("키 없을 때 지도 검색 링크", () => {
    expect(mapSearchLinks("태안", "신진도 외항 방파제").kakao).toContain("map.kakao.com");
  });
});
