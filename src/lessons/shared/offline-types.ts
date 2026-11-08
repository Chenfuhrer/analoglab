/** 离线引导模式的分层提示（无 AI API 时使用），按单元组织 */
export interface UnitHints {
  intuition: string;
  derivation: string;
  example: string;
  keywords: string[];
}
