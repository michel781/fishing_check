import { describe, expect, it } from "vitest";
import { formatKakao, formatNominatim, shortSido } from "./reverse";

describe("좌표 → 글자 주소", () => {
  it("시·도 줄임말", () => {
    expect(shortSido("경상북도")).toBe("경북");
    expect(shortSido("강원특별자치도")).toBe("강원");
    expect(shortSido("서울특별시")).toBe("서울");
  });
  it("OSM: 도 + 군 + 면", () => {
    expect(formatNominatim({ province: "경상북도", county: "울진군", town: "후포면" })).toBe("경북 울진군 후포면");
  });
  it("OSM: 광역시 + 구 + 동 (시 이름 중복 제거)", () => {
    expect(formatNominatim({ city: "부산광역시", borough: "사하구", quarter: "다대동" })).toBe("부산 사하구 다대동");
  });
  it("OSM: 도 + 시 + 구 + 동", () => {
    expect(formatNominatim({ province: "경기도", city: "안산시", borough: "단원구", suburb: "대부동" })).toBe("경기 안산시 단원구 대부동");
  });
  it("카카오: 행정동 우선", () => {
    expect(
      formatKakao([
        { region_type: "B", region_1depth_name: "충청남도", region_2depth_name: "태안군", region_3depth_name: "근흥면 신진도리" },
        { region_type: "H", region_1depth_name: "충청남도", region_2depth_name: "태안군", region_3depth_name: "근흥면" },
      ]),
    ).toBe("충남 태안군 근흥면");
  });
  it("정보 없으면 null", () => {
    expect(formatNominatim(undefined)).toBeNull();
    expect(formatKakao([])).toBeNull();
  });
});
