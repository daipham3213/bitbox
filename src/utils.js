function pad0(str, len) {
  const r = str || str === 0 ? `${str}` : '';
  return r.padStart(len, '0');
}

function formatTimestamp(time) {
  if (time < 60) {
    return `${time}s`;
  }
  if (time < 3600) {
    return `${(time / 60) | 0}m ${pad0(time % 60, 2)}s`;
  }

  return `${(time / 3600) | 0}h ${pad0(((time / 60) | 0) % 60, 2)}m ${pad0(
    time % 60,
    2,
  )}s`;
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = (e) => reject(e);
    fr.readAsArrayBuffer(file);
  });
}

function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  let result = bytes;
  do {
    result /= thresh;
    u += 1;
  } while (
    Math.round(Math.abs(result) * r) / r >= thresh &&
    u < units.length - 1
  );

  return `${result.toFixed(dp)} ${units[u]}`;
}

function $(id) {
  return document.getElementById(id);
}

export { $, readFile, formatTimestamp, pad0, humanFileSize };
