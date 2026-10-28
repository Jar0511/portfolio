import { Document, Font, Page, Text } from "@react-pdf/renderer";

Font.register({
  family: "Pretendard",
  fonts: [
    {
      src: `${import.meta.env.BASE_URL}fonts/ttf/pretendard/Pretendard-Regular.ttf`,
      fontWeight: 400,
    },
    { src: `${import.meta.env.BASE_URL}fonts/ttf/pretendard/Pretendard-Bold.ttf`, fontWeight: 700 },
  ],
});

// 실제 보고서 양식이 추가되기 전까지 성능 측정에 사용하는 공통 문서입니다.
export function BenchmarkDocument({ title, student }: { title: string; student: number }) {
  return (
    <Document title={`${title} - 학생 ${student}`}>
      <Page
        size="A4"
        style={{ fontFamily: "Pretendard", padding: 48, fontSize: 12, lineHeight: 1.7 }}
      >
        <Text style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{title}</Text>
        <Text>학생 {String(student).padStart(3, "0")}</Text>
        <Text>PDF 다운로드 성능 측정을 위한 임시 문서입니다.</Text>
        <Text>실제 보고서 데이터와 양식은 추후 추가됩니다.</Text>
      </Page>
    </Document>
  );
}
