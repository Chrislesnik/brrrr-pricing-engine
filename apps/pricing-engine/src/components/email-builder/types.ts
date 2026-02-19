export type EmailTemplateStyles = {
  body: {
    background: string
  }
  container: {
    align: "left" | "center" | "right"
    width: number
    paddingLeft: number
    paddingRight: number
  }
  typography: {
    fontSize: number
    lineHeight: number
  }
  link: {
    color: string
    decoration: "underline" | "none"
  }
  image: {
    borderRadius: number
  }
  button: {
    background: string
    textColor: string
    radius: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
  }
  codeBlock: {
    borderRadius: number
    paddingH: number
    paddingV: number
    background: string
    textColor: string
  }
  inlineCode: {
    borderRadius: number
    background: string
    textColor: string
  }
  globalCss: string
}

export const defaultEmailStyles: EmailTemplateStyles = {
  body: {
    background: "#f6f6f6",
  },
  container: {
    align: "left",
    width: 600,
    paddingLeft: 0,
    paddingRight: 0,
  },
  typography: {
    fontSize: 14,
    lineHeight: 155,
  },
  link: {
    color: "#0670DB",
    decoration: "underline",
  },
  image: {
    borderRadius: 8,
  },
  button: {
    background: "#000000",
    textColor: "#ffffff",
    radius: 4,
    paddingTop: 7,
    paddingRight: 12,
    paddingBottom: 7,
    paddingLeft: 12,
  },
  codeBlock: {
    borderRadius: 4,
    paddingH: 12,
    paddingV: 12,
    background: "#e5e7eb",
    textColor: "#1e293b",
  },
  inlineCode: {
    borderRadius: 4,
    background: "#f1f5f9",
    textColor: "#0f172a",
  },
  globalCss: "",
}
