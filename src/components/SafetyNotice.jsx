import { AlertTriangle } from "lucide-react";

/**
 * 안전 고지. 가임기 정보를 화면에 띄우는 순간 사용자는 피임/임신 시도에 쓴다.
 * 그래서 푸터 구석이 아니라 예측이 보이는 자리에 같이 둔다.
 *
 * 학습 표본이 40명뿐이라 일반화 성능에 한계가 있다는 점도 함께 알린다.
 */
// ★ 현재 어느 화면도 이걸 렌더하지 않는다. 지우지 않고 남겨 둔 것이다.
//
// 이 프로젝트는 배포하는 서비스가 아니라 발표에서 예측모델을 보여주는 껍데기라,
// 화면마다 고지가 깔리는 게 시연에 방해된다는 판단으로 뺐다(워치는 상단 ⓘ 툴팁으로
// 옮겼고, PC/모바일은 그냥 뺐다).
//
// ⚠️ 실제 사용자에게 나가는 제품이 되면 <b>되살려야 한다.</b> 호르몬 추정치를
//    피임·임신 판단에 쓰면 안 된다는 건 화면에 있어야 하는 정보다.
//    그때는 Home.jsx 의 예측 카드 아래에 <SafetyNotice /> 를 다시 넣으면 된다.

export default function SafetyNotice({ compact = false }) {
  if (compact) {
    return (
      <p className="px-1 text-[9px] leading-tight opacity-50">
        의료 진단 아님 · 피임/임신 목적 사용 금지
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        이 예측은 <strong>의료 진단이 아닌 추정치</strong>입니다.{" "}
        <strong>피임이나 임신 시도 목적으로 사용하지 마세요.</strong>
        <span className="block opacity-70">학습 표본 40명 기준이라 개인차가 클 수 있습니다.</span>
      </p>
    </div>
  );
}
