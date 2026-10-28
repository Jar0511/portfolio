import type { Layout } from "react-grid-layout";

export const widgetTitles = {
  cameras: "카메라",
  bookmarks: "북마크",
  controller: "카메라 컨트롤러",
  recording: "녹화",
  memo: "메모",
  scenario: "시나리오",
  history: "이벤트 히스토리",
};
export type WidgetId = keyof typeof widgetTitles;
export type Columns = 8 | 6 | 4;
export interface Workspace {
  layouts: Record<Columns, Layout>;
  visible: WidgetId[];
  cameraCount: number;
}

function mapLayouts(
  layouts: Workspace["layouts"],
  transform: (layout: Layout, cols: Columns) => Layout,
): Workspace["layouts"] {
  return { 8: transform(layouts[8], 8), 6: transform(layouts[6], 6), 4: transform(layouts[4], 4) };
}

export function createWorkspace(): Workspace {
  const make = (cols: Columns): Layout => {
    const wide = cols === 8;
    const specs: [WidgetId, number, number, number, number][] = [
      ["cameras", 0, 0, wide ? 5 : cols, 10],
      ["controller", wide ? 5 : 0, wide ? 0 : 10, wide ? 3 : cols, 10],
      ["recording", 0, wide ? 10 : 20, wide ? 3 : cols, 4],
      ["bookmarks", wide ? 3 : 0, wide ? 10 : 24, wide ? 5 : cols, 4],
      ["memo", 0, wide ? 14 : 28, wide ? 4 : cols, 5],
      ["scenario", wide ? 4 : 0, wide ? 14 : 33, wide ? 4 : cols, 5],
      ["history", 0, wide ? 19 : 38, cols, 8],
    ];
    return specs.map(([i, x, y, w, h]) => ({
      i,
      x,
      y,
      w,
      h,
      minW: 2,
      minH: i === "controller" ? 10 : i === "cameras" ? 6 : i === "history" ? 5 : 4,
    }));
  };
  return {
    layouts: { 8: make(8), 6: make(6), 4: make(4) },
    visible: Object.keys(widgetTitles) as WidgetId[],
    cameraCount: 4,
  };
}

export interface EditorState {
  present: Workspace;
  saved: Workspace;
  past: Workspace[];
  future: Workspace[];
  editing: boolean;
}
export type EditorAction =
  | { type: "begin" | "save" | "cancel" | "undo" | "redo" | "reset" }
  | { type: "layout"; cols: Columns; layout: Layout }
  | { type: "remove" | "add"; id: WidgetId }
  | { type: "count"; count: number };

export function initialEditor(): EditorState {
  const present = createWorkspace();
  return { present, saved: present, past: [], future: [], editing: false };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === "begin")
    return { ...state, saved: state.present, editing: true, past: [], future: [] };
  if (!state.editing) return state;
  if (action.type === "save" || action.type === "cancel") {
    const present = action.type === "cancel" ? state.saved : state.present;
    return { present, saved: present, editing: false, past: [], future: [] };
  }
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    return previous
      ? {
          ...state,
          present: previous,
          past: state.past.slice(0, -1),
          future: [state.present, ...state.future].slice(0, 30),
        }
      : state;
  }
  if (action.type === "redo") {
    const next = state.future.at(0);
    return next
      ? {
          ...state,
          present: next,
          past: [...state.past, state.present].slice(-30),
          future: state.future.slice(1),
        }
      : state;
  }
  let next = state.present;
  if (action.type === "reset") next = createWorkspace();
  if (action.type === "count")
    next = { ...next, cameraCount: Math.max(1, Math.min(6, action.count)) };
  if (action.type === "layout")
    next = {
      ...next,
      layouts: { ...next.layouts, [action.cols]: action.layout.map((item) => ({ ...item })) },
    };
  if (action.type === "remove" && action.id !== "cameras") {
    next = {
      ...next,
      visible: next.visible.filter((id) => id !== action.id),
      layouts: mapLayouts(next.layouts, (layout) => layout.filter((item) => item.i !== action.id)),
    };
  }
  if (action.type === "add" && !next.visible.includes(action.id)) {
    const defaults = createWorkspace();
    next = {
      ...next,
      visible: [...next.visible, action.id],
      layouts: mapLayouts(next.layouts, (layout, cols) => {
        const template = defaults.layouts[cols].find((item) => item.i === action.id);
        if (!template) return layout;
        const y = Math.max(0, ...layout.map((item) => item.y + item.h));
        return [...layout, { ...template, x: 0, y }];
      }),
    };
  }
  // RGL callback-only metadata must not turn an unchanged gesture into an undo step.
  const signature = (workspace: Workspace) =>
    JSON.stringify({
      ...workspace,
      layouts: Object.fromEntries(
        Object.entries(workspace.layouts).map(([cols, layout]) => [
          cols,
          layout
            .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
            .sort((a, b) => a.i.localeCompare(b.i)),
        ]),
      ),
    });
  return signature(next) === signature(state.present)
    ? state
    : { ...state, present: next, past: [...state.past, state.present].slice(-30), future: [] };
}
