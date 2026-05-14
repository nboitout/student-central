declare module "pdf-parse" {
  interface PageData {
    getTextContent(): Promise<{ items: { str: string }[] }>;
  }
  interface Options {
    pagerender?: (pageData: PageData) => Promise<string>;
  }
  interface Result {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  function pdfParse(buffer: Buffer, options?: Options): Promise<Result>;
  export = pdfParse;
}
