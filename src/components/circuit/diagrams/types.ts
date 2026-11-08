export interface DiagramProps {
  /** 元件数值标注，如 { R: "1 kΩ" }；未给出时只画符号 */
  labels?: Record<string, string>;
  caption?: string;
  testId?: string;
}

export type DiagramComponent = (p: DiagramProps) => React.ReactElement;
