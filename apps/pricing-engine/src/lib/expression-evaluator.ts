/**
 * Safe expression evaluator for logic engine formulas.
 *
 * Supports:
 *  - Arithmetic: +, -, *, /, parentheses
 *  - Input references: {input_id}
 *  - Functions: TODAY, MAX, MIN, SUM, AVG, ROUND, ROUNDUP, ROUNDDOWN,
 *               ABS, IF, DATEDIFF, YEAR, MONTH, DAY, POWER, PMT
 *
 * Uses a tokenizer + recursive descent parser (no eval()).
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type TokenType =
  | "NUMBER"
  | "STRING"
  | "IDENT"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

/* -------------------------------------------------------------------------- */
/*  Tokenizer                                                                  */
/* -------------------------------------------------------------------------- */

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (integer or decimal)
    if (/[0-9]/.test(ch) || (ch === "." && i + 1 < len && /[0-9]/.test(expr[i + 1]))) {
      let num = "";
      while (i < len && (/[0-9]/.test(expr[i]) || expr[i] === ".")) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    // Identifier (function name)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: "IDENT", value: ident });
      continue;
    }

    // String literal (single or double quotes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++; // skip opening quote
      let str = "";
      while (i < len && expr[i] !== quote) {
        str += expr[i];
        i++;
      }
      if (i < len) i++; // skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Single-character tokens
    switch (ch) {
      case "(":
        tokens.push({ type: "LPAREN", value: "(" });
        break;
      case ")":
        tokens.push({ type: "RPAREN", value: ")" });
        break;
      case ",":
        tokens.push({ type: "COMMA", value: "," });
        break;
      case "+":
        tokens.push({ type: "PLUS", value: "+" });
        break;
      case "-":
        tokens.push({ type: "MINUS", value: "-" });
        break;
      case "*":
        tokens.push({ type: "STAR", value: "*" });
        break;
      case "/":
        tokens.push({ type: "SLASH", value: "/" });
        break;
      default:
        // Skip unknown chars
        break;
    }
    i++;
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

/* -------------------------------------------------------------------------- */
/*  Parser + Evaluator (recursive descent)                                     */
/* -------------------------------------------------------------------------- */

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "EOF", value: "" };
  }

  private consume(type?: TokenType): Token {
    const tok = this.peek();
    if (type && tok.type !== type) {
      throw new Error(`Expected ${type}, got ${tok.type} (${tok.value})`);
    }
    this.pos++;
    return tok;
  }

  /** Entry point: parse a full expression */
  parse(): number {
    const result = this.parseExpr();
    return result;
  }

  /** Expression: term (('+' | '-') term)* */
  private parseExpr(): number {
    let left = this.parseTerm();
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.consume();
      const right = this.parseTerm();
      left = op.type === "PLUS" ? left + right : left - right;
    }
    return left;
  }

  /** Term: unary (('*' | '/') unary)* */
  private parseTerm(): number {
    let left = this.parseUnary();
    while (this.peek().type === "STAR" || this.peek().type === "SLASH") {
      const op = this.consume();
      const right = this.parseUnary();
      left = op.type === "STAR" ? left * right : right !== 0 ? left / right : 0;
    }
    return left;
  }

  /** Unary: ('-' | '+')? primary */
  private parseUnary(): number {
    if (this.peek().type === "MINUS") {
      this.consume();
      return -this.parsePrimary();
    }
    if (this.peek().type === "PLUS") {
      this.consume();
      return this.parsePrimary();
    }
    return this.parsePrimary();
  }

  /** Primary: NUMBER | STRING | IDENT '(' args ')' | '(' expr ')' */
  private parsePrimary(): number {
    const tok = this.peek();

    // Number literal
    if (tok.type === "NUMBER") {
      this.consume();
      return parseFloat(tok.value);
    }

    // String literal — try to parse as number, else 0
    if (tok.type === "STRING") {
      this.consume();
      const n = parseFloat(tok.value);
      return isNaN(n) ? 0 : n;
    }

    // Function call or identifier
    if (tok.type === "IDENT") {
      this.consume();
      if (this.peek().type === "LPAREN") {
        return this.parseFunctionCall(tok.value.toUpperCase());
      }
      // Bare identifier — treat as 0
      return 0;
    }

    // Parenthesized expression
    if (tok.type === "LPAREN") {
      this.consume("LPAREN");
      const val = this.parseExpr();
      this.consume("RPAREN");
      return val;
    }

    // Unexpected token — return 0 gracefully
    this.consume();
    return 0;
  }

  /** Parse function call arguments and evaluate */
  private parseFunctionCall(name: string): number {
    this.consume("LPAREN");
    const args: number[] = [];

    if (this.peek().type !== "RPAREN") {
      args.push(this.parseExpr());
      while (this.peek().type === "COMMA") {
        this.consume("COMMA");
        args.push(this.parseExpr());
      }
    }
    this.consume("RPAREN");

    return evaluateFunction(name, args);
  }
}

/* -------------------------------------------------------------------------- */
/*  Built-in functions                                                         */
/* -------------------------------------------------------------------------- */

function evaluateFunction(name: string, args: number[]): number {
  switch (name) {
    case "TODAY": {
      // Returns today as a numeric timestamp (days since epoch)
      const now = new Date();
      return Math.floor(now.getTime() / 86400000);
    }

    case "MAX":
      return args.length > 0 ? Math.max(...args) : 0;

    case "MIN":
      return args.length > 0 ? Math.min(...args) : 0;

    case "SUM":
      return args.reduce((acc, v) => acc + v, 0);

    case "AVG":
      return args.length > 0 ? args.reduce((acc, v) => acc + v, 0) / args.length : 0;

    case "ROUND": {
      const [value = 0, decimals = 0] = args;
      const factor = Math.pow(10, Math.round(decimals));
      return Math.round(value * factor) / factor;
    }

    case "ROUNDUP": {
      const [value = 0, decimals = 0] = args;
      const factor = Math.pow(10, Math.round(decimals));
      return Math.ceil(value * factor) / factor;
    }

    case "ROUNDDOWN": {
      const [value = 0, decimals = 0] = args;
      const factor = Math.pow(10, Math.round(decimals));
      return Math.floor(value * factor) / factor;
    }

    case "ABS":
      return Math.abs(args[0] ?? 0);

    case "IF": {
      // IF(condition, trueValue, falseValue)
      const [condition = 0, trueVal = 0, falseVal = 0] = args;
      return condition !== 0 ? trueVal : falseVal;
    }

    case "DATEDIFF": {
      // DATEDIFF(date1, date2) — returns difference in days
      const [d1 = 0, d2 = 0] = args;
      return Math.abs(d1 - d2);
    }

    case "YEAR": {
      // Treat arg as days since epoch, return year
      const d = new Date((args[0] ?? 0) * 86400000);
      return d.getFullYear();
    }

    case "MONTH": {
      const d = new Date((args[0] ?? 0) * 86400000);
      return d.getMonth() + 1;
    }

    case "DAY": {
      const d = new Date((args[0] ?? 0) * 86400000);
      return d.getDate();
    }

    case "POWER": {
      const [base = 0, exp = 0] = args;
      return Math.pow(base, exp);
    }

    case "PMT": {
      // PMT(rate, nper, pv) — standard financial PMT formula
      // Returns the payment amount (positive = payment out)
      const [rate = 0, nper = 0, pv = 0] = args;
      if (rate === 0) return nper !== 0 ? -pv / nper : 0;
      const pvif = Math.pow(1 + rate, nper);
      return -(rate * pv * pvif) / (pvif - 1);
    }

    default:
      return 0;
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolve `{input_id}` references in an expression string and replace them
 * with their current numeric values.
 */
function resolveReferences(
  expr: string,
  values: Record<string, unknown>
): string {
  return expr.replace(/\{([^}]+)\}/g, (_match, inputId: string) => {
    const val = values[inputId];
    if (val === null || val === undefined || val === "") return "0";
    if (typeof val === "boolean") return val ? "1" : "0";
    const num = Number(val);
    return isNaN(num) ? "0" : String(num);
  });
}

/**
 * Evaluate an expression string against current input values.
 *
 * @param expression - The formula string, e.g. "ROUND({purchase_price} * 0.01, 2)"
 * @param values     - Current form values keyed by input_id
 * @returns The computed numeric result, or null on error
 */
export function evaluateExpression(
  expression: string,
  values: Record<string, unknown>
): number | null {
  try {
    if (!expression || !expression.trim()) return null;

    // Step 1: Resolve {input_id} references to numbers
    const resolved = resolveReferences(expression, values);

    // Step 2: Tokenize
    const tokens = tokenize(resolved);

    // Step 3: Parse & evaluate
    const parser = new Parser(tokens);
    const result = parser.parse();

    // Guard against NaN / Infinity
    if (!isFinite(result)) return null;

    return result;
  } catch {
    return null;
  }
}
