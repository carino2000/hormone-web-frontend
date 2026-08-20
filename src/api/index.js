// src/api/index.js — 교체 지점 (나중에 여기만 실제 fetch/axios 호출로 바꾼다)
// 화면 컴포넌트는 mockData를 직접 import하지 않고, 반드시 이 함수들을 통해서만 데이터를 받는다.
import * as mock from "./mockData";

export const getPredictionSummary = async () => mock.mockPredictionSummary;
export const getHormoneSeries = async () => mock.mockHormoneSeries;
export const getContributions = async () => mock.mockContributions;
export const getVitals = async () => mock.mockVitals;
export const getNextEvents = async () => mock.mockNextEvents;
export const getCalendar = async () => mock.mockCalendar;
