/**
 * Clears the executable-stack flag (PT_GNU_STACK PF_X) on an ELF shared object.
 * Newer kernels (Debian 13 / Ubuntu 25) refuse to load .so files that request
 * an executable stack — CounterStrikeSharp ships with that bit set.
 *
 * Returns the patched buffer, or null when no change is needed / not ELF.
 */
const PT_GNU_STACK = 0x64_74_e5_51;
const PF_X = 0x1;

export function clearElfExecstack(input: Buffer): Buffer | null {
  if (input.length < 64) return null;
  if (input[0] !== 0x7f || input[1] !== 0x45 || input[2] !== 0x4c || input[3] !== 0x46) {
    return null;
  }

  const eiClass = input[4]; // 1 = ELF32, 2 = ELF64
  const eiData = input[5]; // 1 = little, 2 = big
  if (eiClass !== 1 && eiClass !== 2) return null;
  if (eiData !== 1 && eiData !== 2) return null;

  const little = eiData === 1;
  const readU16 = (offset: number) =>
    little ? input.readUInt16LE(offset) : input.readUInt16BE(offset);
  const readU32 = (offset: number) =>
    little ? input.readUInt32LE(offset) : input.readUInt32BE(offset);
  const readU64 = (offset: number) => {
    const lo = readU32(offset);
    const hi = readU32(offset + 4);
    return little ? lo + hi * 0x1_0000_0000 : hi + lo * 0x1_0000_0000;
  };

  const is64 = eiClass === 2;
  const ePhoff = is64 ? Number(readU64(32)) : readU32(28);
  const ePhentsize = readU16(is64 ? 54 : 42);
  const ePhnum = readU16(is64 ? 56 : 44);
  if (!Number.isFinite(ePhoff) || ePhentsize <= 0 || ePhnum <= 0) return null;

  const out = Buffer.from(input);
  let changed = false;

  for (let i = 0; i < ePhnum; i += 1) {
    const off = ePhoff + i * ePhentsize;
    if (off + ePhentsize > out.length) break;
    const pType = readU32(off);
    if (pType !== PT_GNU_STACK) continue;

    const flagsOff = is64 ? off + 4 : off + 24;
    const flags = readU32(flagsOff);
    if ((flags & PF_X) === 0) return null;
    const cleared = flags & ~PF_X;
    if (little) out.writeUInt32LE(cleared >>> 0, flagsOff);
    else out.writeUInt32BE(cleared >>> 0, flagsOff);
    changed = true;
    break;
  }

  return changed ? out : null;
}
