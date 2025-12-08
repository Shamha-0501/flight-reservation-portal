export class Logger {
    private static RESET = "\x1b[0m";

    private static FG = {
        white: "\x1b[37m",
        black: "\x1b[30m",
        green: "\x1b[32m",
        red: "\x1b[31m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        cyan: "\x1b[36m",
    };

    private static BG = {
        green: "\x1b[42m",
        red: "\x1b[41m",
        yellow: "\x1b[43",
        blue: "\x1b[44m"
    };

    private static LABEL_WIDTH = 8;

    private static center(label: string) {
        const total = this.LABEL_WIDTH;
        const len = label.length;

        if (len >= total) return label.slice(0, total);

        const left = Math.floor((total - len) / 2);
        const right = total - len - left;

        return " ".repeat(left) + label + " ".repeat(right);
    }

    private static tag(label: string, fg: string, bg: string) {
        const fgCode = (this.FG as any)[fg] || "";
        const bgCode = (this.BG as any)[bg] || "";

        const centered = this.center(label);
        return `${bgCode}${fgCode} ${centered} ${this.RESET}`;
    }

    static colored_text(message: string, fg: string) {
        const fgCode = (this.FG as any)[fg] || "";
        return `${fgCode}${message} ${this.RESET}`;  
    }

    static info(message: string) {
        const tag = this.tag("INFO", "black", "blue");
        console.log(`${tag} ${message}`);
    }

    static success(message: string) {
        const tag = this.tag("SUCCESS", "black", "green");
        console.log(`${tag} ${message}`);
    }

    static warn(message: string) {
        const tag = this.tag("WARN", "black", "yellow");
        console.log(`${tag} ${message}`);
    }

    static error(message: string) {
        const tag = this.tag("ERROR", "white", "red");
        console.log(`${tag} ${message}`);
    }
}