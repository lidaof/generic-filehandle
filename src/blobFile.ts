interface Stats {
  size: number;
}

// Using this you can "await" the file like a normal promise
// https://blog.shovonhasan.com/using-promises-with-filereader/
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  const fileReader = new FileReader();

  return new Promise(
    (resolve, reject): void => {
      fileReader.onerror = (): void => {
        fileReader.abort();
        reject(new Error("problem reading blob"));
      };

      fileReader.onabort = (): void => {
        reject(new Error("blob reading was aborted"));
      };

      fileReader.onload = (): void => {
        if (fileReader.result && typeof fileReader.result !== "string")
          resolve(fileReader.result);
        else reject(new Error("unknown error reading blob"));
      };
      fileReader.readAsArrayBuffer(blob);
    }
  );
}

function readBlobAsText(blob: Blob): Promise<string> {
  const fileReader = new FileReader();

  return new Promise(
    (resolve, reject): void => {
      fileReader.onerror = (): void => {
        fileReader.abort();
        reject(new Error("problem reading blob"));
      };

      fileReader.onabort = (): void => {
        reject(new Error("blob reading was aborted"));
      };

      fileReader.onload = (): void => {
        if (fileReader.result && typeof fileReader.result === "string")
          resolve(fileReader.result);
        else reject(new Error("unknown error reading blob"));
      };
      fileReader.readAsText(blob);
    }
  );
}

/**
 * Blob of binary data fetched from a local file (with FileReader).
 *
 * Adapted by Robert Buels and Garrett Stevens from the BlobFetchable object in
 * the Dalliance Genome Explorer, which is copyright Thomas Down 2006-2011.
 */
export default class BlobFile implements Filehandle {
  private blob: Blob;
  private size: number;
  public constructor(blob: Blob) {
    this.blob = blob;
    this.size = blob.size;
  }

  public async read(
    buffer: Buffer,
    offset = 0,
    length: number,
    position = 0
  ): Promise<number> {
    // short-circuit a read of 0 bytes here, because browsers actually sometimes
    // crash if you try to read 0 bytes from a local file!
    if (!length) {
      return 0;
    }

    const start = position;
    const end = start + length;

    const result = await readBlobAsArrayBuffer(this.blob.slice(start, end));
    const resultBuffer = Buffer.from(result);

    resultBuffer.copy(buffer, offset);

    return result.byteLength;
  }

  public async readFile(options?: Options | string): Promise<Buffer | string> {
    let encoding;
    if (typeof options === "string") encoding = options;
    else encoding = options && options.encoding;
    if (encoding === "utf8") return readBlobAsText(this.blob);
    if (encoding) throw new Error(`unsupported encoding: ${encoding}`);
    const result = await readBlobAsArrayBuffer(this.blob);
    return Buffer.from(result);
  }

  public async stat(): Promise<Stats> {
    return { size: this.size };
  }
}