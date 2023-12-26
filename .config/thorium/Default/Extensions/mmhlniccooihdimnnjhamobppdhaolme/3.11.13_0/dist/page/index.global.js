(function() {
  "use strict";
  class SiteConfig {
  }
  class SiteConfigLookup {
  }
  class SiteConfigIndex {
  }
  class Config {
  }
  const defaultSiteConfig = new SiteConfigIndex();
  defaultSiteConfig.pageRegex = new SiteConfigLookup();
  defaultSiteConfig.pageRegex["^.*$"] = {
    config: {
      /* TODO:4: ? In future we can give finer control of form rescanning behaviour from here
                  rescanDOMevents:
                  [{
      
                      // /html/body/div[3]/div/h1/small
      
                      type: "click" | "mutation" | "hover" | etc,
                      xpath: "/html/body/div[3]/div/h1/small", // we should do a sanity check on returned items and limit to max of ~a hundred DOM nodes
                      id: "someID",
                      //something else to limit mutation events to create one (e.g. creation of new child item matching certain xpath? etc.)
                  }],
                  */
      preventSaveNotification: false,
      listMatchingCaseSensitive: false,
      /*
              Forms will be scanned iff they have a password (type) field
              UNLESS one of the interestingForms arrays matches the form in question.
              All (w)hitelists will force the form to be scanned for matching passwords.
              (b)lacklists will prevent the form being scanned.
              (b)lacklists have priority over whitelists of the same type but the priorities
              of different types of check are undefined here - you'll have to look at the
              behaviour of the form matching code which is subject to change.
              */
      blackList: {
        form: { names: ["search"], ids: ["search"] },
        fields: { names: ["search", "q", "query"], ids: ["search", "q"] }
      },
      whiteList: {
        form: { names: ["login"], ids: ["login"] },
        fields: {
          names: [
            "username",
            "j_username",
            "user_name",
            "user",
            "user-name",
            "login",
            "vb_login_username",
            "name",
            "user name",
            "user id",
            "user-id",
            "userid",
            "email",
            "e-mail",
            "id",
            "form_loginname",
            "wpname",
            "mail",
            "loginid",
            "login id",
            "login_name",
            "openid_identifier",
            "authentication_email",
            "openid",
            "auth_email",
            "auth_id",
            "authentication_identifier",
            "authentication_id",
            "customer_number",
            "customernumber",
            "onlineid"
          ],
          ids: [
            "username",
            "j_username",
            "user_name",
            "user",
            "user-name",
            "login",
            "vb_login_username",
            "name",
            "user-id",
            "userid",
            "email",
            "e-mail",
            "id",
            "form_loginname",
            "wpname",
            "mail",
            "loginid",
            "login_name",
            "openid_identifier",
            "authentication_email",
            "openid",
            "auth_email",
            "auth_id",
            "authentication_identifier",
            "authentication_id",
            "customer_number",
            "customernumber",
            "onlineid"
          ]
        }
      },
      preferredEntryUuid: null
    },
    matchWeight: 0,
    source: "Default"
  };
  class ConfigMigrations {
    migrateToVersion8(current) {
      Object.assign(current, {
        overWriteFieldsAutomatically: false,
        version: 8
      });
    }
    migrateToVersion7(current) {
      if (current.notificationCountSavePassword > 6) {
        Object.assign(current, {
          notificationCountSavePassword: 6,
          version: 7
        });
      } else {
        Object.assign(current, { version: 7 });
      }
    }
    migrateToVersion6(current) {
      Object.assign(current, {
        animateWhenOfferingSave: true,
        version: 6
      });
    }
    migrateToVersion5(current) {
      Object.assign(current, {
        notifyPasswordAvailableForPaste: true,
        version: 5
      });
    }
    migrateToVersion4(current) {
      let newLogLevel = 2;
      if (current.logLevel === 1) {
        newLogLevel = 1;
      }
      Object.assign(current, { logLevel: newLogLevel, version: 4 });
    }
    migrateToVersion3(current) {
      if (current.notificationCountGeneric == null) {
        current.notificationCountGeneric = 0;
      }
      if (current.notificationCountSavePassword == null) {
        current.notificationCountSavePassword = 0;
      }
      Object.assign(current, {
        currentSearchTermTimeout: 30,
        version: 3
      });
    }
    migrateToVersion2(current) {
      let newSiteConfig = new SiteConfigIndex();
      if (!current.config || current.config.length == 0) {
        newSiteConfig = defaultSiteConfig;
        return;
      }
      newSiteConfig.pageRegex = new SiteConfigLookup();
      newSiteConfig.hostExact = new SiteConfigLookup();
      newSiteConfig.pagePrefix = new SiteConfigLookup();
      newSiteConfig.pageRegex["^.*$"] = {
        matchWeight: 0,
        config: this.migrateIndividualSiteConfigSettingsToV2(current.config[0].config),
        source: "Migration"
      };
      for (let i = 1; i < current.config.length; i++) {
        const url = current.config[i].url;
        if (url.indexOf("://") == -1)
          continue;
        const withoutProtocol = url.substr(url.indexOf("://") + 3);
        if (withoutProtocol.length <= 1)
          continue;
        const newConfig = this.migrateIndividualSiteConfigSettingsToV2(
          current.config[i].config
        );
        const pathIndex = withoutProtocol.indexOf("/");
        if (pathIndex > -1 || pathIndex == withoutProtocol.lastIndexOf("/")) {
          const host = pathIndex > -1 ? withoutProtocol.substr(0, pathIndex) : withoutProtocol;
          newSiteConfig.hostExact[host] = {
            config: newConfig,
            matchWeight: 100,
            source: "Migration"
          };
        } else {
          let weight = 200;
          for (const pagePrefix in newSiteConfig.pagePrefix) {
            if (withoutProtocol.startsWith(pagePrefix))
              weight++;
          }
          newSiteConfig.pagePrefix[withoutProtocol] = {
            config: newConfig,
            matchWeight: weight,
            source: "Migration"
          };
        }
      }
      Object.assign(current, {
        siteConfig: newSiteConfig,
        config: null,
        version: 2
      });
    }
    migrateIndividualSiteConfigSettingsToV2(oldConfig) {
      const sc = new SiteConfig();
      if (oldConfig.preventSaveNotification == null) {
        sc.preventSaveNotification = oldConfig.preventSaveNotification;
      }
      if (oldConfig.interestingForms) {
        if (oldConfig.interestingForms.name_w) {
          if (!sc.whiteList)
            sc.whiteList = { form: { names: [] } };
          else if (!sc.whiteList.form)
            sc.whiteList.form = { names: [] };
          else if (!sc.whiteList.form.names)
            sc.whiteList.form.names = [];
          sc.whiteList.form.names = oldConfig.interestingForms.name_w;
        }
        if (oldConfig.interestingForms.id_w) {
          if (!sc.whiteList)
            sc.whiteList = { form: { ids: [] } };
          else if (!sc.whiteList.form)
            sc.whiteList.form = { ids: [] };
          else if (!sc.whiteList.form.ids)
            sc.whiteList.form.ids = [];
          sc.whiteList.form.ids = oldConfig.interestingForms.id_w;
        }
        if (oldConfig.interestingForms.name_b) {
          if (!sc.blackList)
            sc.blackList = { form: { names: [] } };
          else if (!sc.blackList.form)
            sc.blackList.form = { names: [] };
          else if (!sc.blackList.form.names)
            sc.blackList.form.names = [];
          sc.blackList.form.names = oldConfig.interestingForms.name_b;
        }
        if (oldConfig.interestingForms.id_b) {
          if (!sc.blackList)
            sc.blackList = { form: { ids: [] } };
          else if (!sc.blackList.form)
            sc.blackList.form = { ids: [] };
          else if (!sc.blackList.form.ids)
            sc.blackList.form.ids = [];
          sc.blackList.form.ids = oldConfig.interestingForms.id_b;
        }
        if (oldConfig.interestingForms.f_name_w) {
          if (!sc.whiteList)
            sc.whiteList = { fields: { names: [] } };
          else if (!sc.whiteList.fields)
            sc.whiteList.fields = { names: [] };
          else if (!sc.whiteList.fields.names)
            sc.whiteList.fields.names = [];
          sc.whiteList.fields.names = oldConfig.interestingForms.f_name_w;
        }
        if (oldConfig.interestingForms.f_id_w) {
          if (!sc.whiteList)
            sc.whiteList = { fields: { ids: [] } };
          else if (!sc.whiteList.fields)
            sc.whiteList.fields = { ids: [] };
          else if (!sc.whiteList.fields.ids)
            sc.whiteList.fields.ids = [];
          sc.whiteList.fields.ids = oldConfig.interestingForms.f_id_w;
        }
        if (oldConfig.interestingForms.f_name_b) {
          if (!sc.blackList)
            sc.blackList = { fields: { names: [] } };
          else if (!sc.blackList.fields)
            sc.blackList.fields = { names: [] };
          else if (!sc.blackList.fields.names)
            sc.blackList.fields.names = [];
          sc.blackList.fields.names = oldConfig.interestingForms.f_name_b;
        }
        if (oldConfig.interestingForms.f_id_b) {
          if (!sc.blackList)
            sc.blackList = { fields: { ids: [] } };
          else if (!sc.blackList.fields)
            sc.blackList.fields = { ids: [] };
          else if (!sc.blackList.fields.ids)
            sc.blackList.fields.ids = [];
          sc.blackList.fields.ids = oldConfig.interestingForms.f_id_b;
        }
      }
      return sc;
    }
  }
  const maxInt = 2147483647;
  const base = 36;
  const tMin = 1;
  const tMax = 26;
  const skew = 38;
  const damp = 700;
  const initialBias = 72;
  const initialN = 128;
  const delimiter = "-";
  const regexPunycode = /^xn--/;
  const regexNonASCII = /[^\0-\x7F]/;
  const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
  const errors = {
    "overflow": "Overflow: input needs wider integers to process",
    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
    "invalid-input": "Invalid input"
  };
  const baseMinusTMin = base - tMin;
  const floor = Math.floor;
  const stringFromCharCode = String.fromCharCode;
  function error(type) {
    throw new RangeError(errors[type]);
  }
  function map(array, callback) {
    const result = [];
    let length = array.length;
    while (length--) {
      result[length] = callback(array[length]);
    }
    return result;
  }
  function mapDomain(domain, callback) {
    const parts = domain.split("@");
    let result = "";
    if (parts.length > 1) {
      result = parts[0] + "@";
      domain = parts[1];
    }
    domain = domain.replace(regexSeparators, ".");
    const labels = domain.split(".");
    const encoded = map(labels, callback).join(".");
    return result + encoded;
  }
  function ucs2decode(string) {
    const output = [];
    let counter = 0;
    const length = string.length;
    while (counter < length) {
      const value = string.charCodeAt(counter++);
      if (value >= 55296 && value <= 56319 && counter < length) {
        const extra = string.charCodeAt(counter++);
        if ((extra & 64512) == 56320) {
          output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
        } else {
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }
    return output;
  }
  const ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
  const basicToDigit = function(codePoint) {
    if (codePoint >= 48 && codePoint < 58) {
      return 26 + (codePoint - 48);
    }
    if (codePoint >= 65 && codePoint < 91) {
      return codePoint - 65;
    }
    if (codePoint >= 97 && codePoint < 123) {
      return codePoint - 97;
    }
    return base;
  };
  const digitToBasic = function(digit, flag) {
    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
  };
  const adapt = function(delta, numPoints, firstTime) {
    let k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);
    for (; delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }
    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  };
  const decode = function(input) {
    const output = [];
    const inputLength = input.length;
    let i = 0;
    let n = initialN;
    let bias = initialBias;
    let basic = input.lastIndexOf(delimiter);
    if (basic < 0) {
      basic = 0;
    }
    for (let j = 0; j < basic; ++j) {
      if (input.charCodeAt(j) >= 128) {
        error("not-basic");
      }
      output.push(input.charCodeAt(j));
    }
    for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
      const oldi = i;
      for (let w = 1, k = base; ; k += base) {
        if (index >= inputLength) {
          error("invalid-input");
        }
        const digit = basicToDigit(input.charCodeAt(index++));
        if (digit >= base) {
          error("invalid-input");
        }
        if (digit > floor((maxInt - i) / w)) {
          error("overflow");
        }
        i += digit * w;
        const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
        if (digit < t) {
          break;
        }
        const baseMinusT = base - t;
        if (w > floor(maxInt / baseMinusT)) {
          error("overflow");
        }
        w *= baseMinusT;
      }
      const out = output.length + 1;
      bias = adapt(i - oldi, out, oldi == 0);
      if (floor(i / out) > maxInt - n) {
        error("overflow");
      }
      n += floor(i / out);
      i %= out;
      output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
  };
  const encode = function(input) {
    const output = [];
    input = ucs2decode(input);
    const inputLength = input.length;
    let n = initialN;
    let delta = 0;
    let bias = initialBias;
    for (const currentValue of input) {
      if (currentValue < 128) {
        output.push(stringFromCharCode(currentValue));
      }
    }
    const basicLength = output.length;
    let handledCPCount = basicLength;
    if (basicLength) {
      output.push(delimiter);
    }
    while (handledCPCount < inputLength) {
      let m = maxInt;
      for (const currentValue of input) {
        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      }
      const handledCPCountPlusOne = handledCPCount + 1;
      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        error("overflow");
      }
      delta += (m - n) * handledCPCountPlusOne;
      n = m;
      for (const currentValue of input) {
        if (currentValue < n && ++delta > maxInt) {
          error("overflow");
        }
        if (currentValue === n) {
          let q = delta;
          for (let k = base; ; k += base) {
            const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (q < t) {
              break;
            }
            const qMinusT = q - t;
            const baseMinusT = base - t;
            output.push(
              stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
            );
            q = floor(qMinusT / baseMinusT);
          }
          output.push(stringFromCharCode(digitToBasic(q, 0)));
          bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }
      ++delta;
      ++n;
    }
    return output.join("");
  };
  const toUnicode = function(input) {
    return mapDomain(input, function(string) {
      return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
    });
  };
  const toASCII = function(input) {
    return mapDomain(input, function(string) {
      return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
    });
  };
  const punycode = {
    /**
     * A string representing the current Punycode.js version number.
     * @memberOf punycode
     * @type String
     */
    "version": "2.1.0",
    /**
     * An object of methods to convert from JavaScript's internal character
     * representation (UCS-2) to Unicode code points, and back.
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode
     * @type Object
     */
    "ucs2": {
      "decode": ucs2decode,
      "encode": ucs2encode
    },
    "decode": decode,
    "encode": encode,
    "toASCII": toASCII,
    "toUnicode": toUnicode
  };
  const LABEL_INDICES_SLOT = 256;
  const RULES_PTR_SLOT = 100;
  const SUFFIX_NOT_FOUND_SLOT = 399;
  const CHARDATA_PTR_SLOT = 101;
  const EMPTY_STRING = "";
  const SELFIE_MAGIC = 2;
  class PublicSuffixList {
    constructor() {
      this.version = "3.0";
      this._wasmMemory = null;
      this._pslBuffer32 = null;
      this._pslBuffer8 = null;
      this._pslByteLength = 0;
      this._hostnameArg = EMPTY_STRING;
      this._getPublicSuffixPosWASM = null;
      this._getPublicSuffixPos = this._getPublicSuffixPosJS;
      this._wasmPromise = null;
    }
    /**************************************************************************/
    _allocateBuffers(byteLength) {
      this._pslByteLength = byteLength + 3 & ~3;
      if (this._pslBuffer32 !== null && this._pslBuffer32.byteLength >= this._pslByteLength) {
        return;
      }
      if (this._wasmMemory !== null) {
        const newPageCount = this._pslByteLength + 65535 >>> 16;
        const curPageCount = this._wasmMemory.buffer.byteLength >>> 16;
        const delta = newPageCount - curPageCount;
        if (delta > 0) {
          this._wasmMemory.grow(delta);
          this._pslBuffer32 = new Uint32Array(this._wasmMemory.buffer);
          this._pslBuffer8 = new Uint8Array(this._wasmMemory.buffer);
        }
      } else {
        this._pslBuffer8 = new Uint8Array(this._pslByteLength);
        this._pslBuffer32 = new Uint32Array(this._pslBuffer8.buffer);
      }
      this._hostnameArg = EMPTY_STRING;
      this._pslBuffer8[LABEL_INDICES_SLOT] = 0;
    }
    /**************************************************************************/
    // Parse and set a UTF-8 text-based suffix list. Format is same as found at:
    // http://publicsuffix.org/list/
    //
    // `toAscii` is a converter from unicode to punycode. Required since the
    // Public Suffix List contains unicode characters.
    // Suggestion: use <https://github.com/bestiejs/punycode.js>
    parse(text, toAscii) {
      const rootRule = {
        l: EMPTY_STRING,
        // l => label
        f: 0,
        // f => flags
        c: null
        // c => children
      };
      {
        const compareLabels = function(a, b) {
          let n = a.length;
          let d = n - b.length;
          if (d !== 0) {
            return d;
          }
          for (let i = 0; i < n; i++) {
            d = a.charCodeAt(i) - b.charCodeAt(i);
            if (d !== 0) {
              return d;
            }
          }
          return 0;
        };
        const addToTree = function(rule, exception) {
          let node = rootRule;
          let end = rule.length;
          while (end > 0) {
            const beg = rule.lastIndexOf(".", end - 1);
            const label = rule.slice(beg + 1, end);
            end = beg;
            if (Array.isArray(node.c) === false) {
              const child = { l: label, f: 0, c: null };
              node.c = [child];
              node = child;
              continue;
            }
            let left = 0;
            let right = node.c.length;
            while (left < right) {
              const i = left + right >>> 1;
              const d = compareLabels(label, node.c[i].l);
              if (d < 0) {
                right = i;
                if (right === left) {
                  const child = {
                    l: label,
                    f: 0,
                    c: null
                  };
                  node.c.splice(left, 0, child);
                  node = child;
                  break;
                }
                continue;
              }
              if (d > 0) {
                left = i + 1;
                if (left === right) {
                  const child = {
                    l: label,
                    f: 0,
                    c: null
                  };
                  node.c.splice(right, 0, child);
                  node = child;
                  break;
                }
                continue;
              }
              node = node.c[i];
              break;
            }
          }
          node.f |= 1;
          if (exception) {
            node.f |= 2;
          }
        };
        addToTree("*", false);
        const mustPunycode = /[^*a-z0-9.-]/;
        const textEnd = text.length;
        let lineBeg = 0;
        while (lineBeg < textEnd) {
          let lineEnd = text.indexOf("\n", lineBeg);
          if (lineEnd === -1) {
            lineEnd = text.indexOf("\r", lineBeg);
            if (lineEnd === -1) {
              lineEnd = textEnd;
            }
          }
          let line = text.slice(lineBeg, lineEnd);
          lineBeg = lineEnd + 1;
          const pos = line.indexOf("//");
          if (pos !== -1) {
            line = line.slice(0, pos);
          }
          line = line.trim();
          const exception = line.length > 0 && line.charCodeAt(0) === 33;
          if (exception) {
            line = line.slice(1);
          }
          if (line.length === 0) {
            continue;
          }
          if (mustPunycode.test(line)) {
            line = toAscii(line.toLowerCase());
          }
          if (line.length > 253) {
            continue;
          }
          addToTree(line, exception);
        }
      }
      {
        const labelToOffsetMap = /* @__PURE__ */ new Map();
        const treeData = [];
        const charData = [];
        const allocate = function(n) {
          const ibuf = treeData.length;
          for (let i = 0; i < n; i++) {
            treeData.push(0);
          }
          return ibuf;
        };
        const storeNode = function(ibuf, node) {
          const nChars = node.l.length;
          const nChildren = node.c !== null ? node.c.length : 0;
          treeData[ibuf + 0] = nChildren << 16 | node.f << 8 | nChars;
          if (nChars <= 4) {
            let v = 0;
            if (nChars > 0) {
              v |= node.l.charCodeAt(0);
              if (nChars > 1) {
                v |= node.l.charCodeAt(1) << 8;
                if (nChars > 2) {
                  v |= node.l.charCodeAt(2) << 16;
                  if (nChars > 3) {
                    v |= node.l.charCodeAt(3) << 24;
                  }
                }
              }
            }
            treeData[ibuf + 1] = v;
          } else {
            let offset = labelToOffsetMap.get(node.l);
            if (typeof offset === "undefined") {
              offset = charData.length;
              for (let i = 0; i < nChars; i++) {
                charData.push(node.l.charCodeAt(i));
              }
              labelToOffsetMap.set(node.l, offset);
            }
            treeData[ibuf + 1] = offset;
          }
          if (Array.isArray(node.c) === false) {
            treeData[ibuf + 2] = 0;
            return;
          }
          const iarray = allocate(nChildren * 3);
          treeData[ibuf + 2] = iarray;
          for (let i = 0; i < nChildren; i++) {
            storeNode(iarray + i * 3, node.c[i]);
          }
        };
        allocate(512 >> 2);
        const iRootRule = allocate(3);
        storeNode(iRootRule, rootRule);
        treeData[RULES_PTR_SLOT] = iRootRule;
        const iCharData = treeData.length << 2;
        treeData[CHARDATA_PTR_SLOT] = iCharData;
        const byteLength = (treeData.length << 2) + (charData.length + 3 & ~3);
        this._allocateBuffers(byteLength);
        this._pslBuffer32.set(treeData);
        this._pslBuffer8.set(charData, treeData.length << 2);
      }
    }
    /**************************************************************************/
    _setHostnameArg(hostname) {
      const buf = this._pslBuffer8;
      if (hostname === this._hostnameArg) {
        return buf[LABEL_INDICES_SLOT];
      }
      if (hostname === null || hostname.length === 0) {
        this._hostnameArg = EMPTY_STRING;
        return buf[LABEL_INDICES_SLOT] = 0;
      }
      hostname = hostname.toLowerCase();
      this._hostnameArg = hostname;
      let n = hostname.length;
      if (n > 255) {
        n = 255;
      }
      buf[LABEL_INDICES_SLOT] = n;
      let i = n;
      let j = LABEL_INDICES_SLOT + 1;
      while (i--) {
        const c = hostname.charCodeAt(i);
        if (c === 46) {
          buf[j + 0] = i + 1;
          buf[j + 1] = i;
          j += 2;
        }
        buf[i] = c;
      }
      buf[j] = 0;
      return n;
    }
    /**************************************************************************/
    // Returns an offset to the start of the public suffix.
    //
    // WASM-able, because no information outside the buffer content is required.
    _getPublicSuffixPosJS() {
      const buf8 = this._pslBuffer8;
      const buf32 = this._pslBuffer32;
      const iCharData = buf32[CHARDATA_PTR_SLOT];
      let iNode = this._pslBuffer32[RULES_PTR_SLOT];
      let cursorPos = -1;
      let iLabel = LABEL_INDICES_SLOT;
      for (; ; ) {
        const labelBeg = buf8[iLabel + 1];
        const labelLen = buf8[iLabel + 0] - labelBeg;
        let r = buf32[iNode + 0] >>> 16;
        if (r === 0) {
          break;
        }
        const iCandidates = buf32[iNode + 2];
        let l = 0;
        let iFound = 0;
        while (l < r) {
          const iCandidate = l + r >>> 1;
          const iCandidateNode = iCandidates + iCandidate + (iCandidate << 1);
          const candidateLen = buf32[iCandidateNode + 0] & 255;
          let d = labelLen - candidateLen;
          if (d === 0) {
            const iCandidateChar = candidateLen <= 4 ? iCandidateNode + 1 << 2 : iCharData + buf32[iCandidateNode + 1];
            for (let i = 0; i < labelLen; i++) {
              d = buf8[labelBeg + i] - buf8[iCandidateChar + i];
              if (d !== 0) {
                break;
              }
            }
          }
          if (d < 0) {
            r = iCandidate;
          } else if (d > 0) {
            l = iCandidate + 1;
          } else {
            iFound = iCandidateNode;
            break;
          }
        }
        if (iFound === 0) {
          if (buf32[iCandidates + 1] !== 42) {
            break;
          }
          buf8[SUFFIX_NOT_FOUND_SLOT] = 1;
          iFound = iCandidates;
        }
        iNode = iFound;
        if ((buf32[iNode + 0] & 512) !== 0) {
          if (iLabel > LABEL_INDICES_SLOT) {
            return iLabel - 2;
          }
          break;
        }
        if ((buf32[iNode + 0] & 256) !== 0) {
          cursorPos = iLabel;
        }
        if (labelBeg === 0) {
          break;
        }
        iLabel += 2;
      }
      return cursorPos;
    }
    /**************************************************************************/
    getPublicSuffix(hostname) {
      if (this._pslBuffer32 === null) {
        return EMPTY_STRING;
      }
      const hostnameLen = this._setHostnameArg(hostname);
      const buf8 = this._pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return EMPTY_STRING;
      }
      const cursorPos = this._getPublicSuffixPos();
      if (cursorPos === -1) {
        return EMPTY_STRING;
      }
      const beg = buf8[cursorPos + 1];
      return beg === 0 ? this._hostnameArg : this._hostnameArg.slice(beg);
    }
    /**************************************************************************/
    getDomain(hostname) {
      if (this._pslBuffer32 === null) {
        return EMPTY_STRING;
      }
      const hostnameLen = this._setHostnameArg(hostname);
      const buf8 = this._pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return EMPTY_STRING;
      }
      const cursorPos = this._getPublicSuffixPos();
      if (cursorPos === -1 || buf8[cursorPos + 1] === 0) {
        return EMPTY_STRING;
      }
      const beg = buf8[cursorPos + 3];
      return beg === 0 ? this._hostnameArg : this._hostnameArg.slice(beg);
    }
    /**************************************************************************/
    suffixInPSL(hostname) {
      if (this._pslBuffer32 === null) {
        return false;
      }
      const hostnameLen = this._setHostnameArg(hostname);
      const buf8 = this._pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return false;
      }
      buf8[SUFFIX_NOT_FOUND_SLOT] = 0;
      const cursorPos = this._getPublicSuffixPos();
      return cursorPos !== -1 && buf8[cursorPos + 1] === 0 && buf8[SUFFIX_NOT_FOUND_SLOT] !== 1;
    }
    /**************************************************************************/
    toSelfie(encoder = null) {
      if (this._pslBuffer8 === null) {
        return "";
      }
      if (encoder !== null) {
        const bufferStr = encoder.encode(this._pslBuffer8.buffer, this._pslByteLength);
        return `${SELFIE_MAGIC}	${bufferStr}`;
      }
      return {
        magic: SELFIE_MAGIC,
        buf32: Array.from(
          new Uint32Array(this._pslBuffer8.buffer, 0, this._pslByteLength >>> 2)
        )
      };
    }
    fromSelfie(selfie, decoder = null) {
      let byteLength = 0;
      if (typeof selfie === "string" && selfie.length !== 0 && decoder !== null) {
        const pos = selfie.indexOf("	");
        if (pos === -1 || selfie.slice(0, pos) !== `${SELFIE_MAGIC}`) {
          return false;
        }
        const bufferStr = selfie.slice(pos + 1);
        byteLength = decoder.decodeSize(bufferStr);
        if (byteLength === 0) {
          return false;
        }
        this._allocateBuffers(byteLength);
        decoder.decode(bufferStr, this._pslBuffer8.buffer);
      } else if (selfie.magic === SELFIE_MAGIC && Array.isArray(selfie.buf32)) {
        byteLength = selfie.buf32.length << 2;
        this._allocateBuffers(byteLength);
        this._pslBuffer32.set(selfie.buf32);
      } else {
        return false;
      }
      this._hostnameArg = EMPTY_STRING;
      this._pslBuffer8[LABEL_INDICES_SLOT] = 0;
      return true;
    }
    /**************************************************************************/
    // The WASM module is entirely optional, the JS implementation will be
    // used should the WASM module be unavailable for whatever reason.
    async enableWASM({ customFetch = null } = {}) {
      const wasmModuleFetcher = async ({ customFetch: customFetch2 }) => {
        const url = new URL("data:application/wasm;base64,AGFzbQEAAAABBQFgAAF/AhMBB2ltcG9ydHMGbWVtb3J5AgABAwIBAAcWARJnZXRQdWJsaWNTdWZmaXhQb3MAAArVAgHSAgETf0GUAygCACEAQZADKAIAQQJ0IQFBgAIhAkF/IQMCQANAIAItAAAgAi0AASIEayEFIAEvAQIiCkUNASABKAIIQQJ0IQdBACIJIQgCQANAIAkgCk8NASAJIApqQQF2IgxBAnQiECAQQQF0aiAHaiINLQAAIQ4gBSAOayILRQRAIA5BBE0EQCANQQRqIQ8FIAAgDSgCBGohDwsgBCIQIAVqIRIgDyERAkADQCAQLQAAIBEtAABrIgsNASAQQQFqIhAgEkYNASARQQFqIREMAAsLCyALQQBIBEAgDCEKDAELIAtBAEoEQCAMQQFqIQkMAQsgDSEICwsgCEUEQCAHKAIEQSpHDQJBjwNBAToAACAHIQgLIAgiAS0AASIQQQJxBEAgAkGAAksEQCACQX5qDwsMAgsgEEEBcQRAIAIhAwsgBEUNASACQQJqIQIMAAsLIAML", self.location);
        if (customFetch2 !== null) {
          const response = await customFetch2(url);
          return WebAssembly.compile(await response.arrayBuffer());
        }
        return WebAssembly.compileStreaming(fetch(url));
      };
      const getWasmInstance = async ({ customFetch: customFetch2 }) => {
        if (typeof WebAssembly !== "object") {
          return false;
        }
        const uint32s = new Uint32Array(1);
        const uint8s = new Uint8Array(uint32s.buffer);
        uint32s[0] = 1;
        if (uint8s[0] !== 1) {
          return false;
        }
        try {
          const module = await wasmModuleFetcher({ customFetch: customFetch2 });
          if (module instanceof WebAssembly.Module === false) {
            return false;
          }
          const pageCount = this._pslBuffer8 !== null ? this._pslBuffer8.byteLength + 65535 >>> 16 : 1;
          const memory = new WebAssembly.Memory({ initial: pageCount });
          const instance = await WebAssembly.instantiate(module, {
            imports: { memory }
          });
          if (instance instanceof WebAssembly.Instance === false) {
            return false;
          }
          const curPageCount = memory.buffer.byteLength >>> 16;
          const newPageCount = this._pslBuffer8 !== null ? this._pslBuffer8.byteLength + 65535 >>> 16 : 0;
          if (newPageCount > curPageCount) {
            memory.grow(newPageCount - curPageCount);
          }
          if (this._pslBuffer32 !== null) {
            const buf8 = new Uint8Array(memory.buffer);
            const buf32 = new Uint32Array(memory.buffer);
            buf32.set(this._pslBuffer32);
            this._pslBuffer8 = buf8;
            this._pslBuffer32 = buf32;
          }
          this._wasmMemory = memory;
          this._getPublicSuffixPosWASM = instance.exports.getPublicSuffixPos;
          this._getPublicSuffixPos = this._getPublicSuffixPosWASM;
          return true;
        } catch (reason) {
          console.info(reason);
        }
        return false;
      };
      if (this._wasmPromise === null) {
        this._wasmPromise = getWasmInstance({ customFetch });
      }
      return this._wasmPromise;
    }
    async disableWASM() {
      let enabled = this._wasmPromise !== null ? await this._wasmPromise : false;
      this._getPublicSuffixPos = this._getPublicSuffixPosJS;
      this._getPublicSuffixPosWASM = null;
      if (this._wasmMemory !== null) {
        if (this._pslBuffer32 !== null) {
          const buf8 = new Uint8Array(this._pslByteLength);
          const buf32 = new Uint32Array(buf8.buffer);
          buf32.set(this._pslBuffer32);
          this._pslBuffer8 = buf8;
          this._pslBuffer32 = buf32;
        }
        this._wasmMemory = null;
      }
      this._wasmPromise = null;
      return enabled;
    }
  }
  const publicSuffixList = new PublicSuffixList();
  const pslData = `// This Source Code Form is subject to the terms of the Mozilla Public
    // License, v. 2.0. If a copy of the MPL was not distributed with this
    // file, You can obtain one at https://mozilla.org/MPL/2.0/.

    // Please pull this list from, and only from https://publicsuffix.org/list/public_suffix_list.dat,
    // rather than any other VCS sites. Pulling from any other URL is not guaranteed to be supported.

    // Instructions on pulling and using this list can be found at https://publicsuffix.org/list/.

    // ===BEGIN ICANN DOMAINS===

    // ac : http://nic.ac/rules.htm
    ac
    com.ac
    edu.ac
    gov.ac
    net.ac
    mil.ac
    org.ac

    // ad : https://en.wikipedia.org/wiki/.ad
    ad
    nom.ad

    // ae : https://tdra.gov.ae/en/aeda/ae-policies
    ae
    co.ae
    net.ae
    org.ae
    sch.ae
    ac.ae
    gov.ae
    mil.ae

    // aero : see https://www.information.aero/index.php?id=66
    aero
    accident-investigation.aero
    accident-prevention.aero
    aerobatic.aero
    aeroclub.aero
    aerodrome.aero
    agents.aero
    aircraft.aero
    airline.aero
    airport.aero
    air-surveillance.aero
    airtraffic.aero
    air-traffic-control.aero
    ambulance.aero
    amusement.aero
    association.aero
    author.aero
    ballooning.aero
    broker.aero
    caa.aero
    cargo.aero
    catering.aero
    certification.aero
    championship.aero
    charter.aero
    civilaviation.aero
    club.aero
    conference.aero
    consultant.aero
    consulting.aero
    control.aero
    council.aero
    crew.aero
    design.aero
    dgca.aero
    educator.aero
    emergency.aero
    engine.aero
    engineer.aero
    entertainment.aero
    equipment.aero
    exchange.aero
    express.aero
    federation.aero
    flight.aero
    fuel.aero
    gliding.aero
    government.aero
    groundhandling.aero
    group.aero
    hanggliding.aero
    homebuilt.aero
    insurance.aero
    journal.aero
    journalist.aero
    leasing.aero
    logistics.aero
    magazine.aero
    maintenance.aero
    media.aero
    microlight.aero
    modelling.aero
    navigation.aero
    parachuting.aero
    paragliding.aero
    passenger-association.aero
    pilot.aero
    press.aero
    production.aero
    recreation.aero
    repbody.aero
    res.aero
    research.aero
    rotorcraft.aero
    safety.aero
    scientist.aero
    services.aero
    show.aero
    skydiving.aero
    software.aero
    student.aero
    trader.aero
    trading.aero
    trainer.aero
    union.aero
    workinggroup.aero
    works.aero

    // af : http://www.nic.af/help.jsp
    af
    gov.af
    com.af
    org.af
    net.af
    edu.af

    // ag : http://www.nic.ag/prices.htm
    ag
    com.ag
    org.ag
    net.ag
    co.ag
    nom.ag

    // ai : http://nic.com.ai/
    ai
    off.ai
    com.ai
    net.ai
    org.ai

    // al : http://www.ert.gov.al/ert_alb/faq_det.html?Id=31
    al
    com.al
    edu.al
    gov.al
    mil.al
    net.al
    org.al

    // am : https://www.amnic.net/policy/en/Policy_EN.pdf
    am
    co.am
    com.am
    commune.am
    net.am
    org.am

    // ao : https://en.wikipedia.org/wiki/.ao
    // http://www.dns.ao/REGISTR.DOC
    ao
    ed.ao
    gv.ao
    og.ao
    co.ao
    pb.ao
    it.ao

    // aq : https://en.wikipedia.org/wiki/.aq
    aq

    // ar : https://nic.ar/es/nic-argentina/normativa
    ar
    bet.ar
    com.ar
    coop.ar
    edu.ar
    gob.ar
    gov.ar
    int.ar
    mil.ar
    musica.ar
    mutual.ar
    net.ar
    org.ar
    senasa.ar
    tur.ar

    // arpa : https://en.wikipedia.org/wiki/.arpa
    // Confirmed by registry <iana-questions@icann.org> 2008-06-18
    arpa
    e164.arpa
    in-addr.arpa
    ip6.arpa
    iris.arpa
    uri.arpa
    urn.arpa

    // as : https://en.wikipedia.org/wiki/.as
    as
    gov.as

    // asia : https://en.wikipedia.org/wiki/.asia
    asia

    // at : https://en.wikipedia.org/wiki/.at
    // Confirmed by registry <it@nic.at> 2008-06-17
    at
    ac.at
    co.at
    gv.at
    or.at
    sth.ac.at

    // au : https://en.wikipedia.org/wiki/.au
    // http://www.auda.org.au/
    au
    // 2LDs
    com.au
    net.au
    org.au
    edu.au
    gov.au
    asn.au
    id.au
    // Historic 2LDs (closed to new registration, but sites still exist)
    info.au
    conf.au
    oz.au
    // CGDNs - http://www.cgdn.org.au/
    act.au
    nsw.au
    nt.au
    qld.au
    sa.au
    tas.au
    vic.au
    wa.au
    // 3LDs
    act.edu.au
    catholic.edu.au
    // eq.edu.au - Removed at the request of the Queensland Department of Education
    nsw.edu.au
    nt.edu.au
    qld.edu.au
    sa.edu.au
    tas.edu.au
    vic.edu.au
    wa.edu.au
    // act.gov.au  Bug 984824 - Removed at request of Greg Tankard
    // nsw.gov.au  Bug 547985 - Removed at request of <Shae.Donelan@services.nsw.gov.au>
    // nt.gov.au  Bug 940478 - Removed at request of Greg Connors <Greg.Connors@nt.gov.au>
    qld.gov.au
    sa.gov.au
    tas.gov.au
    vic.gov.au
    wa.gov.au
    // 4LDs
    // education.tas.edu.au - Removed at the request of the Department of Education Tasmania
    schools.nsw.edu.au

    // aw : https://en.wikipedia.org/wiki/.aw
    aw
    com.aw

    // ax : https://en.wikipedia.org/wiki/.ax
    ax

    // az : https://en.wikipedia.org/wiki/.az
    az
    com.az
    net.az
    int.az
    gov.az
    org.az
    edu.az
    info.az
    pp.az
    mil.az
    name.az
    pro.az
    biz.az

    // ba : http://nic.ba/users_data/files/pravilnik_o_registraciji.pdf
    ba
    com.ba
    edu.ba
    gov.ba
    mil.ba
    net.ba
    org.ba

    // bb : https://en.wikipedia.org/wiki/.bb
    bb
    biz.bb
    co.bb
    com.bb
    edu.bb
    gov.bb
    info.bb
    net.bb
    org.bb
    store.bb
    tv.bb

    // bd : https://en.wikipedia.org/wiki/.bd
    *.bd

    // be : https://en.wikipedia.org/wiki/.be
    // Confirmed by registry <tech@dns.be> 2008-06-08
    be
    ac.be

    // bf : https://en.wikipedia.org/wiki/.bf
    bf
    gov.bf

    // bg : https://en.wikipedia.org/wiki/.bg
    // https://www.register.bg/user/static/rules/en/index.html
    bg
    a.bg
    b.bg
    c.bg
    d.bg
    e.bg
    f.bg
    g.bg
    h.bg
    i.bg
    j.bg
    k.bg
    l.bg
    m.bg
    n.bg
    o.bg
    p.bg
    q.bg
    r.bg
    s.bg
    t.bg
    u.bg
    v.bg
    w.bg
    x.bg
    y.bg
    z.bg
    0.bg
    1.bg
    2.bg
    3.bg
    4.bg
    5.bg
    6.bg
    7.bg
    8.bg
    9.bg

    // bh : https://en.wikipedia.org/wiki/.bh
    bh
    com.bh
    edu.bh
    net.bh
    org.bh
    gov.bh

    // bi : https://en.wikipedia.org/wiki/.bi
    // http://whois.nic.bi/
    bi
    co.bi
    com.bi
    edu.bi
    or.bi
    org.bi

    // biz : https://en.wikipedia.org/wiki/.biz
    biz

    // bj : https://en.wikipedia.org/wiki/.bj
    bj
    asso.bj
    barreau.bj
    gouv.bj

    // bm : http://www.bermudanic.bm/dnr-text.txt
    bm
    com.bm
    edu.bm
    gov.bm
    net.bm
    org.bm

    // bn : http://www.bnnic.bn/faqs
    bn
    com.bn
    edu.bn
    gov.bn
    net.bn
    org.bn

    // bo : https://nic.bo/delegacion2015.php#h-1.10
    bo
    com.bo
    edu.bo
    gob.bo
    int.bo
    org.bo
    net.bo
    mil.bo
    tv.bo
    web.bo
    // Social Domains
    academia.bo
    agro.bo
    arte.bo
    blog.bo
    bolivia.bo
    ciencia.bo
    cooperativa.bo
    democracia.bo
    deporte.bo
    ecologia.bo
    economia.bo
    empresa.bo
    indigena.bo
    industria.bo
    info.bo
    medicina.bo
    movimiento.bo
    musica.bo
    natural.bo
    nombre.bo
    noticias.bo
    patria.bo
    politica.bo
    profesional.bo
    plurinacional.bo
    pueblo.bo
    revista.bo
    salud.bo
    tecnologia.bo
    tksat.bo
    transporte.bo
    wiki.bo

    // br : http://registro.br/dominio/categoria.html
    // Submitted by registry <fneves@registro.br>
    br
    9guacu.br
    abc.br
    adm.br
    adv.br
    agr.br
    aju.br
    am.br
    anani.br
    aparecida.br
    app.br
    arq.br
    art.br
    ato.br
    b.br
    barueri.br
    belem.br
    bhz.br
    bib.br
    bio.br
    blog.br
    bmd.br
    boavista.br
    bsb.br
    campinagrande.br
    campinas.br
    caxias.br
    cim.br
    cng.br
    cnt.br
    com.br
    contagem.br
    coop.br
    coz.br
    cri.br
    cuiaba.br
    curitiba.br
    def.br
    des.br
    det.br
    dev.br
    ecn.br
    eco.br
    edu.br
    emp.br
    enf.br
    eng.br
    esp.br
    etc.br
    eti.br
    far.br
    feira.br
    flog.br
    floripa.br
    fm.br
    fnd.br
    fortal.br
    fot.br
    foz.br
    fst.br
    g12.br
    geo.br
    ggf.br
    goiania.br
    gov.br
    // gov.br 26 states + df https://en.wikipedia.org/wiki/States_of_Brazil
    ac.gov.br
    al.gov.br
    am.gov.br
    ap.gov.br
    ba.gov.br
    ce.gov.br
    df.gov.br
    es.gov.br
    go.gov.br
    ma.gov.br
    mg.gov.br
    ms.gov.br
    mt.gov.br
    pa.gov.br
    pb.gov.br
    pe.gov.br
    pi.gov.br
    pr.gov.br
    rj.gov.br
    rn.gov.br
    ro.gov.br
    rr.gov.br
    rs.gov.br
    sc.gov.br
    se.gov.br
    sp.gov.br
    to.gov.br
    gru.br
    imb.br
    ind.br
    inf.br
    jab.br
    jampa.br
    jdf.br
    joinville.br
    jor.br
    jus.br
    leg.br
    lel.br
    log.br
    londrina.br
    macapa.br
    maceio.br
    manaus.br
    maringa.br
    mat.br
    med.br
    mil.br
    morena.br
    mp.br
    mus.br
    natal.br
    net.br
    niteroi.br
    *.nom.br
    not.br
    ntr.br
    odo.br
    ong.br
    org.br
    osasco.br
    palmas.br
    poa.br
    ppg.br
    pro.br
    psc.br
    psi.br
    pvh.br
    qsl.br
    radio.br
    rec.br
    recife.br
    rep.br
    ribeirao.br
    rio.br
    riobranco.br
    riopreto.br
    salvador.br
    sampa.br
    santamaria.br
    santoandre.br
    saobernardo.br
    saogonca.br
    seg.br
    sjc.br
    slg.br
    slz.br
    sorocaba.br
    srv.br
    taxi.br
    tc.br
    tec.br
    teo.br
    the.br
    tmp.br
    trd.br
    tur.br
    tv.br
    udi.br
    vet.br
    vix.br
    vlog.br
    wiki.br
    zlg.br

    // bs : http://www.nic.bs/rules.html
    bs
    com.bs
    net.bs
    org.bs
    edu.bs
    gov.bs

    // bt : https://en.wikipedia.org/wiki/.bt
    bt
    com.bt
    edu.bt
    gov.bt
    net.bt
    org.bt

    // bv : No registrations at this time.
    // Submitted by registry <jarle@uninett.no>
    bv

    // bw : https://en.wikipedia.org/wiki/.bw
    // http://www.gobin.info/domainname/bw.doc
    // list of other 2nd level tlds ?
    bw
    co.bw
    org.bw

    // by : https://en.wikipedia.org/wiki/.by
    // http://tld.by/rules_2006_en.html
    // list of other 2nd level tlds ?
    by
    gov.by
    mil.by
    // Official information does not indicate that com.by is a reserved
    // second-level domain, but it's being used as one (see www.google.com.by and
    // www.yahoo.com.by, for example), so we list it here for safety's sake.
    com.by

    // http://hoster.by/
    of.by

    // bz : https://en.wikipedia.org/wiki/.bz
    // http://www.belizenic.bz/
    bz
    com.bz
    net.bz
    org.bz
    edu.bz
    gov.bz

    // ca : https://en.wikipedia.org/wiki/.ca
    ca
    // ca geographical names
    ab.ca
    bc.ca
    mb.ca
    nb.ca
    nf.ca
    nl.ca
    ns.ca
    nt.ca
    nu.ca
    on.ca
    pe.ca
    qc.ca
    sk.ca
    yk.ca
    // gc.ca: https://en.wikipedia.org/wiki/.gc.ca
    // see also: http://registry.gc.ca/en/SubdomainFAQ
    gc.ca

    // cat : https://en.wikipedia.org/wiki/.cat
    cat

    // cc : https://en.wikipedia.org/wiki/.cc
    cc

    // cd : https://en.wikipedia.org/wiki/.cd
    // see also: https://www.nic.cd/domain/insertDomain_2.jsp?act=1
    cd
    gov.cd

    // cf : https://en.wikipedia.org/wiki/.cf
    cf

    // cg : https://en.wikipedia.org/wiki/.cg
    cg

    // ch : https://en.wikipedia.org/wiki/.ch
    ch

    // ci : https://en.wikipedia.org/wiki/.ci
    // http://www.nic.ci/index.php?page=charte
    ci
    org.ci
    or.ci
    com.ci
    co.ci
    edu.ci
    ed.ci
    ac.ci
    net.ci
    go.ci
    asso.ci
    aéroport.ci
    int.ci
    presse.ci
    md.ci
    gouv.ci

    // ck : https://en.wikipedia.org/wiki/.ck
    *.ck
    !www.ck

    // cl : https://www.nic.cl
    // Confirmed by .CL registry <hsalgado@nic.cl>
    cl
    co.cl
    gob.cl
    gov.cl
    mil.cl

    // cm : https://en.wikipedia.org/wiki/.cm plus bug 981927
    cm
    co.cm
    com.cm
    gov.cm
    net.cm

    // cn : https://en.wikipedia.org/wiki/.cn
    // Submitted by registry <tanyaling@cnnic.cn>
    cn
    ac.cn
    com.cn
    edu.cn
    gov.cn
    net.cn
    org.cn
    mil.cn
    公司.cn
    网络.cn
    網絡.cn
    // cn geographic names
    ah.cn
    bj.cn
    cq.cn
    fj.cn
    gd.cn
    gs.cn
    gz.cn
    gx.cn
    ha.cn
    hb.cn
    he.cn
    hi.cn
    hl.cn
    hn.cn
    jl.cn
    js.cn
    jx.cn
    ln.cn
    nm.cn
    nx.cn
    qh.cn
    sc.cn
    sd.cn
    sh.cn
    sn.cn
    sx.cn
    tj.cn
    xj.cn
    xz.cn
    yn.cn
    zj.cn
    hk.cn
    mo.cn
    tw.cn

    // co : https://en.wikipedia.org/wiki/.co
    // Submitted by registry <tecnico@uniandes.edu.co>
    co
    arts.co
    com.co
    edu.co
    firm.co
    gov.co
    info.co
    int.co
    mil.co
    net.co
    nom.co
    org.co
    rec.co
    web.co

    // com : https://en.wikipedia.org/wiki/.com
    com

    // coop : https://en.wikipedia.org/wiki/.coop
    coop

    // cr : http://www.nic.cr/niccr_publico/showRegistroDominiosScreen.do
    cr
    ac.cr
    co.cr
    ed.cr
    fi.cr
    go.cr
    or.cr
    sa.cr

    // cu : https://en.wikipedia.org/wiki/.cu
    cu
    com.cu
    edu.cu
    org.cu
    net.cu
    gov.cu
    inf.cu

    // cv : https://en.wikipedia.org/wiki/.cv
    // cv : http://www.dns.cv/tldcv_portal/do?com=DS;5446457100;111;+PAGE(4000018)+K-CAT-CODIGO(RDOM)+RCNT(100); <- registration rules
    cv
    com.cv
    edu.cv
    int.cv
    nome.cv
    org.cv

    // cw : http://www.una.cw/cw_registry/
    // Confirmed by registry <registry@una.net> 2013-03-26
    cw
    com.cw
    edu.cw
    net.cw
    org.cw

    // cx : https://en.wikipedia.org/wiki/.cx
    // list of other 2nd level tlds ?
    cx
    gov.cx

    // cy : http://www.nic.cy/
    // Submitted by registry Panayiotou Fotia <cydns@ucy.ac.cy>
    // namespace policies URL https://www.nic.cy/portal//sites/default/files/symfonia_gia_eggrafi.pdf
    cy
    ac.cy
    biz.cy
    com.cy
    ekloges.cy
    gov.cy
    ltd.cy
    mil.cy
    net.cy
    org.cy
    press.cy
    pro.cy
    tm.cy

    // cz : https://en.wikipedia.org/wiki/.cz
    cz

    // de : https://en.wikipedia.org/wiki/.de
    // Confirmed by registry <ops@denic.de> (with technical
    // reservations) 2008-07-01
    de

    // dj : https://en.wikipedia.org/wiki/.dj
    dj

    // dk : https://en.wikipedia.org/wiki/.dk
    // Confirmed by registry <robert@dk-hostmaster.dk> 2008-06-17
    dk

    // dm : https://en.wikipedia.org/wiki/.dm
    dm
    com.dm
    net.dm
    org.dm
    edu.dm
    gov.dm

    // do : https://en.wikipedia.org/wiki/.do
    do
    art.do
    com.do
    edu.do
    gob.do
    gov.do
    mil.do
    net.do
    org.do
    sld.do
    web.do

    // dz : http://www.nic.dz/images/pdf_nic/charte.pdf
    dz
    art.dz
    asso.dz
    com.dz
    edu.dz
    gov.dz
    org.dz
    net.dz
    pol.dz
    soc.dz
    tm.dz

    // ec : http://www.nic.ec/reg/paso1.asp
    // Submitted by registry <vabboud@nic.ec>
    ec
    com.ec
    info.ec
    net.ec
    fin.ec
    k12.ec
    med.ec
    pro.ec
    org.ec
    edu.ec
    gov.ec
    gob.ec
    mil.ec

    // edu : https://en.wikipedia.org/wiki/.edu
    edu

    // ee : http://www.eenet.ee/EENet/dom_reeglid.html#lisa_B
    ee
    edu.ee
    gov.ee
    riik.ee
    lib.ee
    med.ee
    com.ee
    pri.ee
    aip.ee
    org.ee
    fie.ee

    // eg : https://en.wikipedia.org/wiki/.eg
    eg
    com.eg
    edu.eg
    eun.eg
    gov.eg
    mil.eg
    name.eg
    net.eg
    org.eg
    sci.eg

    // er : https://en.wikipedia.org/wiki/.er
    *.er

    // es : https://www.nic.es/site_ingles/ingles/dominios/index.html
    es
    com.es
    nom.es
    org.es
    gob.es
    edu.es

    // et : https://en.wikipedia.org/wiki/.et
    et
    com.et
    gov.et
    org.et
    edu.et
    biz.et
    name.et
    info.et
    net.et

    // eu : https://en.wikipedia.org/wiki/.eu
    eu

    // fi : https://en.wikipedia.org/wiki/.fi
    fi
    // aland.fi : https://en.wikipedia.org/wiki/.ax
    // This domain is being phased out in favor of .ax. As there are still many
    // domains under aland.fi, we still keep it on the list until aland.fi is
    // completely removed.
    // TODO: Check for updates (expected to be phased out around Q1/2009)
    aland.fi

    // fj : http://domains.fj/
    // Submitted by registry <garth.miller@cocca.org.nz> 2020-02-11
    fj
    ac.fj
    biz.fj
    com.fj
    gov.fj
    info.fj
    mil.fj
    name.fj
    net.fj
    org.fj
    pro.fj

    // fk : https://en.wikipedia.org/wiki/.fk
    *.fk

    // fm : https://en.wikipedia.org/wiki/.fm
    com.fm
    edu.fm
    net.fm
    org.fm
    fm

    // fo : https://en.wikipedia.org/wiki/.fo
    fo

    // fr : http://www.afnic.fr/
    // domaines descriptifs : https://www.afnic.fr/medias/documents/Cadre_legal/Afnic_Naming_Policy_12122016_VEN.pdf
    fr
    asso.fr
    com.fr
    gouv.fr
    nom.fr
    prd.fr
    tm.fr
    // domaines sectoriels : https://www.afnic.fr/en/products-and-services/the-fr-tld/sector-based-fr-domains-4.html
    aeroport.fr
    avocat.fr
    avoues.fr
    cci.fr
    chambagri.fr
    chirurgiens-dentistes.fr
    experts-comptables.fr
    geometre-expert.fr
    greta.fr
    huissier-justice.fr
    medecin.fr
    notaires.fr
    pharmacien.fr
    port.fr
    veterinaire.fr

    // ga : https://en.wikipedia.org/wiki/.ga
    ga

    // gb : This registry is effectively dormant
    // Submitted by registry <Damien.Shaw@ja.net>
    gb

    // gd : https://en.wikipedia.org/wiki/.gd
    edu.gd
    gov.gd
    gd

    // ge : http://www.nic.net.ge/policy_en.pdf
    ge
    com.ge
    edu.ge
    gov.ge
    org.ge
    mil.ge
    net.ge
    pvt.ge

    // gf : https://en.wikipedia.org/wiki/.gf
    gf

    // gg : http://www.channelisles.net/register-domains/
    // Confirmed by registry <nigel@channelisles.net> 2013-11-28
    gg
    co.gg
    net.gg
    org.gg

    // gh : https://en.wikipedia.org/wiki/.gh
    // see also: http://www.nic.gh/reg_now.php
    // Although domains directly at second level are not possible at the moment,
    // they have been possible for some time and may come back.
    gh
    com.gh
    edu.gh
    gov.gh
    org.gh
    mil.gh

    // gi : http://www.nic.gi/rules.html
    gi
    com.gi
    ltd.gi
    gov.gi
    mod.gi
    edu.gi
    org.gi

    // gl : https://en.wikipedia.org/wiki/.gl
    // http://nic.gl
    gl
    co.gl
    com.gl
    edu.gl
    net.gl
    org.gl

    // gm : http://www.nic.gm/htmlpages%5Cgm-policy.htm
    gm

    // gn : http://psg.com/dns/gn/gn.txt
    // Submitted by registry <randy@psg.com>
    gn
    ac.gn
    com.gn
    edu.gn
    gov.gn
    org.gn
    net.gn

    // gov : https://en.wikipedia.org/wiki/.gov
    gov

    // gp : http://www.nic.gp/index.php?lang=en
    gp
    com.gp
    net.gp
    mobi.gp
    edu.gp
    org.gp
    asso.gp

    // gq : https://en.wikipedia.org/wiki/.gq
    gq

    // gr : https://grweb.ics.forth.gr/english/1617-B-2005.html
    // Submitted by registry <segred@ics.forth.gr>
    gr
    com.gr
    edu.gr
    net.gr
    org.gr
    gov.gr

    // gs : https://en.wikipedia.org/wiki/.gs
    gs

    // gt : https://www.gt/sitio/registration_policy.php?lang=en
    gt
    com.gt
    edu.gt
    gob.gt
    ind.gt
    mil.gt
    net.gt
    org.gt

    // gu : http://gadao.gov.gu/register.html
    // University of Guam : https://www.uog.edu
    // Submitted by uognoc@triton.uog.edu
    gu
    com.gu
    edu.gu
    gov.gu
    guam.gu
    info.gu
    net.gu
    org.gu
    web.gu

    // gw : https://en.wikipedia.org/wiki/.gw
    // gw : https://nic.gw/regras/
    gw

    // gy : https://en.wikipedia.org/wiki/.gy
    // http://registry.gy/
    gy
    co.gy
    com.gy
    edu.gy
    gov.gy
    net.gy
    org.gy

    // hk : https://www.hkirc.hk
    // Submitted by registry <hk.tech@hkirc.hk>
    hk
    com.hk
    edu.hk
    gov.hk
    idv.hk
    net.hk
    org.hk
    公司.hk
    教育.hk
    敎育.hk
    政府.hk
    個人.hk
    个人.hk
    箇人.hk
    網络.hk
    网络.hk
    组織.hk
    網絡.hk
    网絡.hk
    组织.hk
    組織.hk
    組织.hk

    // hm : https://en.wikipedia.org/wiki/.hm
    hm

    // hn : http://www.nic.hn/politicas/ps02,,05.html
    hn
    com.hn
    edu.hn
    org.hn
    net.hn
    mil.hn
    gob.hn

    // hr : http://www.dns.hr/documents/pdf/HRTLD-regulations.pdf
    hr
    iz.hr
    from.hr
    name.hr
    com.hr

    // ht : http://www.nic.ht/info/charte.cfm
    ht
    com.ht
    shop.ht
    firm.ht
    info.ht
    adult.ht
    net.ht
    pro.ht
    org.ht
    med.ht
    art.ht
    coop.ht
    pol.ht
    asso.ht
    edu.ht
    rel.ht
    gouv.ht
    perso.ht

    // hu : http://www.domain.hu/domain/English/sld.html
    // Confirmed by registry <pasztor@iszt.hu> 2008-06-12
    hu
    co.hu
    info.hu
    org.hu
    priv.hu
    sport.hu
    tm.hu
    2000.hu
    agrar.hu
    bolt.hu
    casino.hu
    city.hu
    erotica.hu
    erotika.hu
    film.hu
    forum.hu
    games.hu
    hotel.hu
    ingatlan.hu
    jogasz.hu
    konyvelo.hu
    lakas.hu
    media.hu
    news.hu
    reklam.hu
    sex.hu
    shop.hu
    suli.hu
    szex.hu
    tozsde.hu
    utazas.hu
    video.hu

    // id : https://pandi.id/en/domain/registration-requirements/
    id
    ac.id
    biz.id
    co.id
    desa.id
    go.id
    mil.id
    my.id
    net.id
    or.id
    ponpes.id
    sch.id
    web.id

    // ie : https://en.wikipedia.org/wiki/.ie
    ie
    gov.ie

    // il :         http://www.isoc.org.il/domains/
    // see also:    https://en.isoc.org.il/il-cctld/registration-rules
    // ISOC-IL      (operated by .il Registry)
    il
    ac.il
    co.il
    gov.il
    idf.il
    k12.il
    muni.il
    net.il
    org.il
    // xn--4dbrk0ce ("Israel", Hebrew) : IL
    ישראל
    // xn--4dbgdty6c.xn--4dbrk0ce.
    אקדמיה.ישראל
    // xn--5dbhl8d.xn--4dbrk0ce.
    ישוב.ישראל
    // xn--8dbq2a.xn--4dbrk0ce.
    צהל.ישראל
    // xn--hebda8b.xn--4dbrk0ce.
    ממשל.ישראל

    // im : https://www.nic.im/
    // Submitted by registry <info@nic.im>
    im
    ac.im
    co.im
    com.im
    ltd.co.im
    net.im
    org.im
    plc.co.im
    tt.im
    tv.im

    // in : https://en.wikipedia.org/wiki/.in
    // see also: https://registry.in/policies
    // Please note, that nic.in is not an official eTLD, but used by most
    // government institutions.
    in
    5g.in
    6g.in
    ac.in
    ai.in
    am.in
    bihar.in
    biz.in
    business.in
    ca.in
    cn.in
    co.in
    com.in
    coop.in
    cs.in
    delhi.in
    dr.in
    edu.in
    er.in
    firm.in
    gen.in
    gov.in
    gujarat.in
    ind.in
    info.in
    int.in
    internet.in
    io.in
    me.in
    mil.in
    net.in
    nic.in
    org.in
    pg.in
    post.in
    pro.in
    res.in
    travel.in
    tv.in
    uk.in
    up.in
    us.in

    // info : https://en.wikipedia.org/wiki/.info
    info

    // int : https://en.wikipedia.org/wiki/.int
    // Confirmed by registry <iana-questions@icann.org> 2008-06-18
    int
    eu.int

    // io : http://www.nic.io/rules.htm
    // list of other 2nd level tlds ?
    io
    com.io

    // iq : http://www.cmc.iq/english/iq/iqregister1.htm
    iq
    gov.iq
    edu.iq
    mil.iq
    com.iq
    org.iq
    net.iq

    // ir : http://www.nic.ir/Terms_and_Conditions_ir,_Appendix_1_Domain_Rules
    // Also see http://www.nic.ir/Internationalized_Domain_Names
    // Two <iran>.ir entries added at request of <tech-team@nic.ir>, 2010-04-16
    ir
    ac.ir
    co.ir
    gov.ir
    id.ir
    net.ir
    org.ir
    sch.ir
    // xn--mgba3a4f16a.ir (<iran>.ir, Persian YEH)
    ایران.ir
    // xn--mgba3a4fra.ir (<iran>.ir, Arabic YEH)
    ايران.ir

    // is : http://www.isnic.is/domain/rules.php
    // Confirmed by registry <marius@isgate.is> 2008-12-06
    is
    net.is
    com.is
    edu.is
    gov.is
    org.is
    int.is

    // it : https://en.wikipedia.org/wiki/.it
    it
    gov.it
    edu.it
    // Reserved geo-names (regions and provinces):
    // https://www.nic.it/sites/default/files/archivio/docs/Regulation_assignation_v7.1.pdf
    // Regions
    abr.it
    abruzzo.it
    aosta-valley.it
    aostavalley.it
    bas.it
    basilicata.it
    cal.it
    calabria.it
    cam.it
    campania.it
    emilia-romagna.it
    emiliaromagna.it
    emr.it
    friuli-v-giulia.it
    friuli-ve-giulia.it
    friuli-vegiulia.it
    friuli-venezia-giulia.it
    friuli-veneziagiulia.it
    friuli-vgiulia.it
    friuliv-giulia.it
    friulive-giulia.it
    friulivegiulia.it
    friulivenezia-giulia.it
    friuliveneziagiulia.it
    friulivgiulia.it
    fvg.it
    laz.it
    lazio.it
    lig.it
    liguria.it
    lom.it
    lombardia.it
    lombardy.it
    lucania.it
    mar.it
    marche.it
    mol.it
    molise.it
    piedmont.it
    piemonte.it
    pmn.it
    pug.it
    puglia.it
    sar.it
    sardegna.it
    sardinia.it
    sic.it
    sicilia.it
    sicily.it
    taa.it
    tos.it
    toscana.it
    trentin-sud-tirol.it
    trentin-süd-tirol.it
    trentin-sudtirol.it
    trentin-südtirol.it
    trentin-sued-tirol.it
    trentin-suedtirol.it
    trentino-a-adige.it
    trentino-aadige.it
    trentino-alto-adige.it
    trentino-altoadige.it
    trentino-s-tirol.it
    trentino-stirol.it
    trentino-sud-tirol.it
    trentino-süd-tirol.it
    trentino-sudtirol.it
    trentino-südtirol.it
    trentino-sued-tirol.it
    trentino-suedtirol.it
    trentino.it
    trentinoa-adige.it
    trentinoaadige.it
    trentinoalto-adige.it
    trentinoaltoadige.it
    trentinos-tirol.it
    trentinostirol.it
    trentinosud-tirol.it
    trentinosüd-tirol.it
    trentinosudtirol.it
    trentinosüdtirol.it
    trentinosued-tirol.it
    trentinosuedtirol.it
    trentinsud-tirol.it
    trentinsüd-tirol.it
    trentinsudtirol.it
    trentinsüdtirol.it
    trentinsued-tirol.it
    trentinsuedtirol.it
    tuscany.it
    umb.it
    umbria.it
    val-d-aosta.it
    val-daosta.it
    vald-aosta.it
    valdaosta.it
    valle-aosta.it
    valle-d-aosta.it
    valle-daosta.it
    valleaosta.it
    valled-aosta.it
    valledaosta.it
    vallee-aoste.it
    vallée-aoste.it
    vallee-d-aoste.it
    vallée-d-aoste.it
    valleeaoste.it
    valléeaoste.it
    valleedaoste.it
    valléedaoste.it
    vao.it
    vda.it
    ven.it
    veneto.it
    // Provinces
    ag.it
    agrigento.it
    al.it
    alessandria.it
    alto-adige.it
    altoadige.it
    an.it
    ancona.it
    andria-barletta-trani.it
    andria-trani-barletta.it
    andriabarlettatrani.it
    andriatranibarletta.it
    ao.it
    aosta.it
    aoste.it
    ap.it
    aq.it
    aquila.it
    ar.it
    arezzo.it
    ascoli-piceno.it
    ascolipiceno.it
    asti.it
    at.it
    av.it
    avellino.it
    ba.it
    balsan-sudtirol.it
    balsan-südtirol.it
    balsan-suedtirol.it
    balsan.it
    bari.it
    barletta-trani-andria.it
    barlettatraniandria.it
    belluno.it
    benevento.it
    bergamo.it
    bg.it
    bi.it
    biella.it
    bl.it
    bn.it
    bo.it
    bologna.it
    bolzano-altoadige.it
    bolzano.it
    bozen-sudtirol.it
    bozen-südtirol.it
    bozen-suedtirol.it
    bozen.it
    br.it
    brescia.it
    brindisi.it
    bs.it
    bt.it
    bulsan-sudtirol.it
    bulsan-südtirol.it
    bulsan-suedtirol.it
    bulsan.it
    bz.it
    ca.it
    cagliari.it
    caltanissetta.it
    campidano-medio.it
    campidanomedio.it
    campobasso.it
    carbonia-iglesias.it
    carboniaiglesias.it
    carrara-massa.it
    carraramassa.it
    caserta.it
    catania.it
    catanzaro.it
    cb.it
    ce.it
    cesena-forli.it
    cesena-forlì.it
    cesenaforli.it
    cesenaforlì.it
    ch.it
    chieti.it
    ci.it
    cl.it
    cn.it
    co.it
    como.it
    cosenza.it
    cr.it
    cremona.it
    crotone.it
    cs.it
    ct.it
    cuneo.it
    cz.it
    dell-ogliastra.it
    dellogliastra.it
    en.it
    enna.it
    fc.it
    fe.it
    fermo.it
    ferrara.it
    fg.it
    fi.it
    firenze.it
    florence.it
    fm.it
    foggia.it
    forli-cesena.it
    forlì-cesena.it
    forlicesena.it
    forlìcesena.it
    fr.it
    frosinone.it
    ge.it
    genoa.it
    genova.it
    go.it
    gorizia.it
    gr.it
    grosseto.it
    iglesias-carbonia.it
    iglesiascarbonia.it
    im.it
    imperia.it
    is.it
    isernia.it
    kr.it
    la-spezia.it
    laquila.it
    laspezia.it
    latina.it
    lc.it
    le.it
    lecce.it
    lecco.it
    li.it
    livorno.it
    lo.it
    lodi.it
    lt.it
    lu.it
    lucca.it
    macerata.it
    mantova.it
    massa-carrara.it
    massacarrara.it
    matera.it
    mb.it
    mc.it
    me.it
    medio-campidano.it
    mediocampidano.it
    messina.it
    mi.it
    milan.it
    milano.it
    mn.it
    mo.it
    modena.it
    monza-brianza.it
    monza-e-della-brianza.it
    monza.it
    monzabrianza.it
    monzaebrianza.it
    monzaedellabrianza.it
    ms.it
    mt.it
    na.it
    naples.it
    napoli.it
    no.it
    novara.it
    nu.it
    nuoro.it
    og.it
    ogliastra.it
    olbia-tempio.it
    olbiatempio.it
    or.it
    oristano.it
    ot.it
    pa.it
    padova.it
    padua.it
    palermo.it
    parma.it
    pavia.it
    pc.it
    pd.it
    pe.it
    perugia.it
    pesaro-urbino.it
    pesarourbino.it
    pescara.it
    pg.it
    pi.it
    piacenza.it
    pisa.it
    pistoia.it
    pn.it
    po.it
    pordenone.it
    potenza.it
    pr.it
    prato.it
    pt.it
    pu.it
    pv.it
    pz.it
    ra.it
    ragusa.it
    ravenna.it
    rc.it
    re.it
    reggio-calabria.it
    reggio-emilia.it
    reggiocalabria.it
    reggioemilia.it
    rg.it
    ri.it
    rieti.it
    rimini.it
    rm.it
    rn.it
    ro.it
    roma.it
    rome.it
    rovigo.it
    sa.it
    salerno.it
    sassari.it
    savona.it
    si.it
    siena.it
    siracusa.it
    so.it
    sondrio.it
    sp.it
    sr.it
    ss.it
    suedtirol.it
    südtirol.it
    sv.it
    ta.it
    taranto.it
    te.it
    tempio-olbia.it
    tempioolbia.it
    teramo.it
    terni.it
    tn.it
    to.it
    torino.it
    tp.it
    tr.it
    trani-andria-barletta.it
    trani-barletta-andria.it
    traniandriabarletta.it
    tranibarlettaandria.it
    trapani.it
    trento.it
    treviso.it
    trieste.it
    ts.it
    turin.it
    tv.it
    ud.it
    udine.it
    urbino-pesaro.it
    urbinopesaro.it
    va.it
    varese.it
    vb.it
    vc.it
    ve.it
    venezia.it
    venice.it
    verbania.it
    vercelli.it
    verona.it
    vi.it
    vibo-valentia.it
    vibovalentia.it
    vicenza.it
    viterbo.it
    vr.it
    vs.it
    vt.it
    vv.it

    // je : http://www.channelisles.net/register-domains/
    // Confirmed by registry <nigel@channelisles.net> 2013-11-28
    je
    co.je
    net.je
    org.je

    // jm : http://www.com.jm/register.html
    *.jm

    // jo : http://www.dns.jo/Registration_policy.aspx
    jo
    com.jo
    org.jo
    net.jo
    edu.jo
    sch.jo
    gov.jo
    mil.jo
    name.jo

    // jobs : https://en.wikipedia.org/wiki/.jobs
    jobs

    // jp : https://en.wikipedia.org/wiki/.jp
    // http://jprs.co.jp/en/jpdomain.html
    // Submitted by registry <info@jprs.jp>
    jp
    // jp organizational type names
    ac.jp
    ad.jp
    co.jp
    ed.jp
    go.jp
    gr.jp
    lg.jp
    ne.jp
    or.jp
    // jp prefecture type names
    aichi.jp
    akita.jp
    aomori.jp
    chiba.jp
    ehime.jp
    fukui.jp
    fukuoka.jp
    fukushima.jp
    gifu.jp
    gunma.jp
    hiroshima.jp
    hokkaido.jp
    hyogo.jp
    ibaraki.jp
    ishikawa.jp
    iwate.jp
    kagawa.jp
    kagoshima.jp
    kanagawa.jp
    kochi.jp
    kumamoto.jp
    kyoto.jp
    mie.jp
    miyagi.jp
    miyazaki.jp
    nagano.jp
    nagasaki.jp
    nara.jp
    niigata.jp
    oita.jp
    okayama.jp
    okinawa.jp
    osaka.jp
    saga.jp
    saitama.jp
    shiga.jp
    shimane.jp
    shizuoka.jp
    tochigi.jp
    tokushima.jp
    tokyo.jp
    tottori.jp
    toyama.jp
    wakayama.jp
    yamagata.jp
    yamaguchi.jp
    yamanashi.jp
    栃木.jp
    愛知.jp
    愛媛.jp
    兵庫.jp
    熊本.jp
    茨城.jp
    北海道.jp
    千葉.jp
    和歌山.jp
    長崎.jp
    長野.jp
    新潟.jp
    青森.jp
    静岡.jp
    東京.jp
    石川.jp
    埼玉.jp
    三重.jp
    京都.jp
    佐賀.jp
    大分.jp
    大阪.jp
    奈良.jp
    宮城.jp
    宮崎.jp
    富山.jp
    山口.jp
    山形.jp
    山梨.jp
    岩手.jp
    岐阜.jp
    岡山.jp
    島根.jp
    広島.jp
    徳島.jp
    沖縄.jp
    滋賀.jp
    神奈川.jp
    福井.jp
    福岡.jp
    福島.jp
    秋田.jp
    群馬.jp
    香川.jp
    高知.jp
    鳥取.jp
    鹿児島.jp
    // jp geographic type names
    // http://jprs.jp/doc/rule/saisoku-1.html
    *.kawasaki.jp
    *.kitakyushu.jp
    *.kobe.jp
    *.nagoya.jp
    *.sapporo.jp
    *.sendai.jp
    *.yokohama.jp
    !city.kawasaki.jp
    !city.kitakyushu.jp
    !city.kobe.jp
    !city.nagoya.jp
    !city.sapporo.jp
    !city.sendai.jp
    !city.yokohama.jp
    // 4th level registration
    aisai.aichi.jp
    ama.aichi.jp
    anjo.aichi.jp
    asuke.aichi.jp
    chiryu.aichi.jp
    chita.aichi.jp
    fuso.aichi.jp
    gamagori.aichi.jp
    handa.aichi.jp
    hazu.aichi.jp
    hekinan.aichi.jp
    higashiura.aichi.jp
    ichinomiya.aichi.jp
    inazawa.aichi.jp
    inuyama.aichi.jp
    isshiki.aichi.jp
    iwakura.aichi.jp
    kanie.aichi.jp
    kariya.aichi.jp
    kasugai.aichi.jp
    kira.aichi.jp
    kiyosu.aichi.jp
    komaki.aichi.jp
    konan.aichi.jp
    kota.aichi.jp
    mihama.aichi.jp
    miyoshi.aichi.jp
    nishio.aichi.jp
    nisshin.aichi.jp
    obu.aichi.jp
    oguchi.aichi.jp
    oharu.aichi.jp
    okazaki.aichi.jp
    owariasahi.aichi.jp
    seto.aichi.jp
    shikatsu.aichi.jp
    shinshiro.aichi.jp
    shitara.aichi.jp
    tahara.aichi.jp
    takahama.aichi.jp
    tobishima.aichi.jp
    toei.aichi.jp
    togo.aichi.jp
    tokai.aichi.jp
    tokoname.aichi.jp
    toyoake.aichi.jp
    toyohashi.aichi.jp
    toyokawa.aichi.jp
    toyone.aichi.jp
    toyota.aichi.jp
    tsushima.aichi.jp
    yatomi.aichi.jp
    akita.akita.jp
    daisen.akita.jp
    fujisato.akita.jp
    gojome.akita.jp
    hachirogata.akita.jp
    happou.akita.jp
    higashinaruse.akita.jp
    honjo.akita.jp
    honjyo.akita.jp
    ikawa.akita.jp
    kamikoani.akita.jp
    kamioka.akita.jp
    katagami.akita.jp
    kazuno.akita.jp
    kitaakita.akita.jp
    kosaka.akita.jp
    kyowa.akita.jp
    misato.akita.jp
    mitane.akita.jp
    moriyoshi.akita.jp
    nikaho.akita.jp
    noshiro.akita.jp
    odate.akita.jp
    oga.akita.jp
    ogata.akita.jp
    semboku.akita.jp
    yokote.akita.jp
    yurihonjo.akita.jp
    aomori.aomori.jp
    gonohe.aomori.jp
    hachinohe.aomori.jp
    hashikami.aomori.jp
    hiranai.aomori.jp
    hirosaki.aomori.jp
    itayanagi.aomori.jp
    kuroishi.aomori.jp
    misawa.aomori.jp
    mutsu.aomori.jp
    nakadomari.aomori.jp
    noheji.aomori.jp
    oirase.aomori.jp
    owani.aomori.jp
    rokunohe.aomori.jp
    sannohe.aomori.jp
    shichinohe.aomori.jp
    shingo.aomori.jp
    takko.aomori.jp
    towada.aomori.jp
    tsugaru.aomori.jp
    tsuruta.aomori.jp
    abiko.chiba.jp
    asahi.chiba.jp
    chonan.chiba.jp
    chosei.chiba.jp
    choshi.chiba.jp
    chuo.chiba.jp
    funabashi.chiba.jp
    futtsu.chiba.jp
    hanamigawa.chiba.jp
    ichihara.chiba.jp
    ichikawa.chiba.jp
    ichinomiya.chiba.jp
    inzai.chiba.jp
    isumi.chiba.jp
    kamagaya.chiba.jp
    kamogawa.chiba.jp
    kashiwa.chiba.jp
    katori.chiba.jp
    katsuura.chiba.jp
    kimitsu.chiba.jp
    kisarazu.chiba.jp
    kozaki.chiba.jp
    kujukuri.chiba.jp
    kyonan.chiba.jp
    matsudo.chiba.jp
    midori.chiba.jp
    mihama.chiba.jp
    minamiboso.chiba.jp
    mobara.chiba.jp
    mutsuzawa.chiba.jp
    nagara.chiba.jp
    nagareyama.chiba.jp
    narashino.chiba.jp
    narita.chiba.jp
    noda.chiba.jp
    oamishirasato.chiba.jp
    omigawa.chiba.jp
    onjuku.chiba.jp
    otaki.chiba.jp
    sakae.chiba.jp
    sakura.chiba.jp
    shimofusa.chiba.jp
    shirako.chiba.jp
    shiroi.chiba.jp
    shisui.chiba.jp
    sodegaura.chiba.jp
    sosa.chiba.jp
    tako.chiba.jp
    tateyama.chiba.jp
    togane.chiba.jp
    tohnosho.chiba.jp
    tomisato.chiba.jp
    urayasu.chiba.jp
    yachimata.chiba.jp
    yachiyo.chiba.jp
    yokaichiba.chiba.jp
    yokoshibahikari.chiba.jp
    yotsukaido.chiba.jp
    ainan.ehime.jp
    honai.ehime.jp
    ikata.ehime.jp
    imabari.ehime.jp
    iyo.ehime.jp
    kamijima.ehime.jp
    kihoku.ehime.jp
    kumakogen.ehime.jp
    masaki.ehime.jp
    matsuno.ehime.jp
    matsuyama.ehime.jp
    namikata.ehime.jp
    niihama.ehime.jp
    ozu.ehime.jp
    saijo.ehime.jp
    seiyo.ehime.jp
    shikokuchuo.ehime.jp
    tobe.ehime.jp
    toon.ehime.jp
    uchiko.ehime.jp
    uwajima.ehime.jp
    yawatahama.ehime.jp
    echizen.fukui.jp
    eiheiji.fukui.jp
    fukui.fukui.jp
    ikeda.fukui.jp
    katsuyama.fukui.jp
    mihama.fukui.jp
    minamiechizen.fukui.jp
    obama.fukui.jp
    ohi.fukui.jp
    ono.fukui.jp
    sabae.fukui.jp
    sakai.fukui.jp
    takahama.fukui.jp
    tsuruga.fukui.jp
    wakasa.fukui.jp
    ashiya.fukuoka.jp
    buzen.fukuoka.jp
    chikugo.fukuoka.jp
    chikuho.fukuoka.jp
    chikujo.fukuoka.jp
    chikushino.fukuoka.jp
    chikuzen.fukuoka.jp
    chuo.fukuoka.jp
    dazaifu.fukuoka.jp
    fukuchi.fukuoka.jp
    hakata.fukuoka.jp
    higashi.fukuoka.jp
    hirokawa.fukuoka.jp
    hisayama.fukuoka.jp
    iizuka.fukuoka.jp
    inatsuki.fukuoka.jp
    kaho.fukuoka.jp
    kasuga.fukuoka.jp
    kasuya.fukuoka.jp
    kawara.fukuoka.jp
    keisen.fukuoka.jp
    koga.fukuoka.jp
    kurate.fukuoka.jp
    kurogi.fukuoka.jp
    kurume.fukuoka.jp
    minami.fukuoka.jp
    miyako.fukuoka.jp
    miyama.fukuoka.jp
    miyawaka.fukuoka.jp
    mizumaki.fukuoka.jp
    munakata.fukuoka.jp
    nakagawa.fukuoka.jp
    nakama.fukuoka.jp
    nishi.fukuoka.jp
    nogata.fukuoka.jp
    ogori.fukuoka.jp
    okagaki.fukuoka.jp
    okawa.fukuoka.jp
    oki.fukuoka.jp
    omuta.fukuoka.jp
    onga.fukuoka.jp
    onojo.fukuoka.jp
    oto.fukuoka.jp
    saigawa.fukuoka.jp
    sasaguri.fukuoka.jp
    shingu.fukuoka.jp
    shinyoshitomi.fukuoka.jp
    shonai.fukuoka.jp
    soeda.fukuoka.jp
    sue.fukuoka.jp
    tachiarai.fukuoka.jp
    tagawa.fukuoka.jp
    takata.fukuoka.jp
    toho.fukuoka.jp
    toyotsu.fukuoka.jp
    tsuiki.fukuoka.jp
    ukiha.fukuoka.jp
    umi.fukuoka.jp
    usui.fukuoka.jp
    yamada.fukuoka.jp
    yame.fukuoka.jp
    yanagawa.fukuoka.jp
    yukuhashi.fukuoka.jp
    aizubange.fukushima.jp
    aizumisato.fukushima.jp
    aizuwakamatsu.fukushima.jp
    asakawa.fukushima.jp
    bandai.fukushima.jp
    date.fukushima.jp
    fukushima.fukushima.jp
    furudono.fukushima.jp
    futaba.fukushima.jp
    hanawa.fukushima.jp
    higashi.fukushima.jp
    hirata.fukushima.jp
    hirono.fukushima.jp
    iitate.fukushima.jp
    inawashiro.fukushima.jp
    ishikawa.fukushima.jp
    iwaki.fukushima.jp
    izumizaki.fukushima.jp
    kagamiishi.fukushima.jp
    kaneyama.fukushima.jp
    kawamata.fukushima.jp
    kitakata.fukushima.jp
    kitashiobara.fukushima.jp
    koori.fukushima.jp
    koriyama.fukushima.jp
    kunimi.fukushima.jp
    miharu.fukushima.jp
    mishima.fukushima.jp
    namie.fukushima.jp
    nango.fukushima.jp
    nishiaizu.fukushima.jp
    nishigo.fukushima.jp
    okuma.fukushima.jp
    omotego.fukushima.jp
    ono.fukushima.jp
    otama.fukushima.jp
    samegawa.fukushima.jp
    shimogo.fukushima.jp
    shirakawa.fukushima.jp
    showa.fukushima.jp
    soma.fukushima.jp
    sukagawa.fukushima.jp
    taishin.fukushima.jp
    tamakawa.fukushima.jp
    tanagura.fukushima.jp
    tenei.fukushima.jp
    yabuki.fukushima.jp
    yamato.fukushima.jp
    yamatsuri.fukushima.jp
    yanaizu.fukushima.jp
    yugawa.fukushima.jp
    anpachi.gifu.jp
    ena.gifu.jp
    gifu.gifu.jp
    ginan.gifu.jp
    godo.gifu.jp
    gujo.gifu.jp
    hashima.gifu.jp
    hichiso.gifu.jp
    hida.gifu.jp
    higashishirakawa.gifu.jp
    ibigawa.gifu.jp
    ikeda.gifu.jp
    kakamigahara.gifu.jp
    kani.gifu.jp
    kasahara.gifu.jp
    kasamatsu.gifu.jp
    kawaue.gifu.jp
    kitagata.gifu.jp
    mino.gifu.jp
    minokamo.gifu.jp
    mitake.gifu.jp
    mizunami.gifu.jp
    motosu.gifu.jp
    nakatsugawa.gifu.jp
    ogaki.gifu.jp
    sakahogi.gifu.jp
    seki.gifu.jp
    sekigahara.gifu.jp
    shirakawa.gifu.jp
    tajimi.gifu.jp
    takayama.gifu.jp
    tarui.gifu.jp
    toki.gifu.jp
    tomika.gifu.jp
    wanouchi.gifu.jp
    yamagata.gifu.jp
    yaotsu.gifu.jp
    yoro.gifu.jp
    annaka.gunma.jp
    chiyoda.gunma.jp
    fujioka.gunma.jp
    higashiagatsuma.gunma.jp
    isesaki.gunma.jp
    itakura.gunma.jp
    kanna.gunma.jp
    kanra.gunma.jp
    katashina.gunma.jp
    kawaba.gunma.jp
    kiryu.gunma.jp
    kusatsu.gunma.jp
    maebashi.gunma.jp
    meiwa.gunma.jp
    midori.gunma.jp
    minakami.gunma.jp
    naganohara.gunma.jp
    nakanojo.gunma.jp
    nanmoku.gunma.jp
    numata.gunma.jp
    oizumi.gunma.jp
    ora.gunma.jp
    ota.gunma.jp
    shibukawa.gunma.jp
    shimonita.gunma.jp
    shinto.gunma.jp
    showa.gunma.jp
    takasaki.gunma.jp
    takayama.gunma.jp
    tamamura.gunma.jp
    tatebayashi.gunma.jp
    tomioka.gunma.jp
    tsukiyono.gunma.jp
    tsumagoi.gunma.jp
    ueno.gunma.jp
    yoshioka.gunma.jp
    asaminami.hiroshima.jp
    daiwa.hiroshima.jp
    etajima.hiroshima.jp
    fuchu.hiroshima.jp
    fukuyama.hiroshima.jp
    hatsukaichi.hiroshima.jp
    higashihiroshima.hiroshima.jp
    hongo.hiroshima.jp
    jinsekikogen.hiroshima.jp
    kaita.hiroshima.jp
    kui.hiroshima.jp
    kumano.hiroshima.jp
    kure.hiroshima.jp
    mihara.hiroshima.jp
    miyoshi.hiroshima.jp
    naka.hiroshima.jp
    onomichi.hiroshima.jp
    osakikamijima.hiroshima.jp
    otake.hiroshima.jp
    saka.hiroshima.jp
    sera.hiroshima.jp
    seranishi.hiroshima.jp
    shinichi.hiroshima.jp
    shobara.hiroshima.jp
    takehara.hiroshima.jp
    abashiri.hokkaido.jp
    abira.hokkaido.jp
    aibetsu.hokkaido.jp
    akabira.hokkaido.jp
    akkeshi.hokkaido.jp
    asahikawa.hokkaido.jp
    ashibetsu.hokkaido.jp
    ashoro.hokkaido.jp
    assabu.hokkaido.jp
    atsuma.hokkaido.jp
    bibai.hokkaido.jp
    biei.hokkaido.jp
    bifuka.hokkaido.jp
    bihoro.hokkaido.jp
    biratori.hokkaido.jp
    chippubetsu.hokkaido.jp
    chitose.hokkaido.jp
    date.hokkaido.jp
    ebetsu.hokkaido.jp
    embetsu.hokkaido.jp
    eniwa.hokkaido.jp
    erimo.hokkaido.jp
    esan.hokkaido.jp
    esashi.hokkaido.jp
    fukagawa.hokkaido.jp
    fukushima.hokkaido.jp
    furano.hokkaido.jp
    furubira.hokkaido.jp
    haboro.hokkaido.jp
    hakodate.hokkaido.jp
    hamatonbetsu.hokkaido.jp
    hidaka.hokkaido.jp
    higashikagura.hokkaido.jp
    higashikawa.hokkaido.jp
    hiroo.hokkaido.jp
    hokuryu.hokkaido.jp
    hokuto.hokkaido.jp
    honbetsu.hokkaido.jp
    horokanai.hokkaido.jp
    horonobe.hokkaido.jp
    ikeda.hokkaido.jp
    imakane.hokkaido.jp
    ishikari.hokkaido.jp
    iwamizawa.hokkaido.jp
    iwanai.hokkaido.jp
    kamifurano.hokkaido.jp
    kamikawa.hokkaido.jp
    kamishihoro.hokkaido.jp
    kamisunagawa.hokkaido.jp
    kamoenai.hokkaido.jp
    kayabe.hokkaido.jp
    kembuchi.hokkaido.jp
    kikonai.hokkaido.jp
    kimobetsu.hokkaido.jp
    kitahiroshima.hokkaido.jp
    kitami.hokkaido.jp
    kiyosato.hokkaido.jp
    koshimizu.hokkaido.jp
    kunneppu.hokkaido.jp
    kuriyama.hokkaido.jp
    kuromatsunai.hokkaido.jp
    kushiro.hokkaido.jp
    kutchan.hokkaido.jp
    kyowa.hokkaido.jp
    mashike.hokkaido.jp
    matsumae.hokkaido.jp
    mikasa.hokkaido.jp
    minamifurano.hokkaido.jp
    mombetsu.hokkaido.jp
    moseushi.hokkaido.jp
    mukawa.hokkaido.jp
    muroran.hokkaido.jp
    naie.hokkaido.jp
    nakagawa.hokkaido.jp
    nakasatsunai.hokkaido.jp
    nakatombetsu.hokkaido.jp
    nanae.hokkaido.jp
    nanporo.hokkaido.jp
    nayoro.hokkaido.jp
    nemuro.hokkaido.jp
    niikappu.hokkaido.jp
    niki.hokkaido.jp
    nishiokoppe.hokkaido.jp
    noboribetsu.hokkaido.jp
    numata.hokkaido.jp
    obihiro.hokkaido.jp
    obira.hokkaido.jp
    oketo.hokkaido.jp
    okoppe.hokkaido.jp
    otaru.hokkaido.jp
    otobe.hokkaido.jp
    otofuke.hokkaido.jp
    otoineppu.hokkaido.jp
    oumu.hokkaido.jp
    ozora.hokkaido.jp
    pippu.hokkaido.jp
    rankoshi.hokkaido.jp
    rebun.hokkaido.jp
    rikubetsu.hokkaido.jp
    rishiri.hokkaido.jp
    rishirifuji.hokkaido.jp
    saroma.hokkaido.jp
    sarufutsu.hokkaido.jp
    shakotan.hokkaido.jp
    shari.hokkaido.jp
    shibecha.hokkaido.jp
    shibetsu.hokkaido.jp
    shikabe.hokkaido.jp
    shikaoi.hokkaido.jp
    shimamaki.hokkaido.jp
    shimizu.hokkaido.jp
    shimokawa.hokkaido.jp
    shinshinotsu.hokkaido.jp
    shintoku.hokkaido.jp
    shiranuka.hokkaido.jp
    shiraoi.hokkaido.jp
    shiriuchi.hokkaido.jp
    sobetsu.hokkaido.jp
    sunagawa.hokkaido.jp
    taiki.hokkaido.jp
    takasu.hokkaido.jp
    takikawa.hokkaido.jp
    takinoue.hokkaido.jp
    teshikaga.hokkaido.jp
    tobetsu.hokkaido.jp
    tohma.hokkaido.jp
    tomakomai.hokkaido.jp
    tomari.hokkaido.jp
    toya.hokkaido.jp
    toyako.hokkaido.jp
    toyotomi.hokkaido.jp
    toyoura.hokkaido.jp
    tsubetsu.hokkaido.jp
    tsukigata.hokkaido.jp
    urakawa.hokkaido.jp
    urausu.hokkaido.jp
    uryu.hokkaido.jp
    utashinai.hokkaido.jp
    wakkanai.hokkaido.jp
    wassamu.hokkaido.jp
    yakumo.hokkaido.jp
    yoichi.hokkaido.jp
    aioi.hyogo.jp
    akashi.hyogo.jp
    ako.hyogo.jp
    amagasaki.hyogo.jp
    aogaki.hyogo.jp
    asago.hyogo.jp
    ashiya.hyogo.jp
    awaji.hyogo.jp
    fukusaki.hyogo.jp
    goshiki.hyogo.jp
    harima.hyogo.jp
    himeji.hyogo.jp
    ichikawa.hyogo.jp
    inagawa.hyogo.jp
    itami.hyogo.jp
    kakogawa.hyogo.jp
    kamigori.hyogo.jp
    kamikawa.hyogo.jp
    kasai.hyogo.jp
    kasuga.hyogo.jp
    kawanishi.hyogo.jp
    miki.hyogo.jp
    minamiawaji.hyogo.jp
    nishinomiya.hyogo.jp
    nishiwaki.hyogo.jp
    ono.hyogo.jp
    sanda.hyogo.jp
    sannan.hyogo.jp
    sasayama.hyogo.jp
    sayo.hyogo.jp
    shingu.hyogo.jp
    shinonsen.hyogo.jp
    shiso.hyogo.jp
    sumoto.hyogo.jp
    taishi.hyogo.jp
    taka.hyogo.jp
    takarazuka.hyogo.jp
    takasago.hyogo.jp
    takino.hyogo.jp
    tamba.hyogo.jp
    tatsuno.hyogo.jp
    toyooka.hyogo.jp
    yabu.hyogo.jp
    yashiro.hyogo.jp
    yoka.hyogo.jp
    yokawa.hyogo.jp
    ami.ibaraki.jp
    asahi.ibaraki.jp
    bando.ibaraki.jp
    chikusei.ibaraki.jp
    daigo.ibaraki.jp
    fujishiro.ibaraki.jp
    hitachi.ibaraki.jp
    hitachinaka.ibaraki.jp
    hitachiomiya.ibaraki.jp
    hitachiota.ibaraki.jp
    ibaraki.ibaraki.jp
    ina.ibaraki.jp
    inashiki.ibaraki.jp
    itako.ibaraki.jp
    iwama.ibaraki.jp
    joso.ibaraki.jp
    kamisu.ibaraki.jp
    kasama.ibaraki.jp
    kashima.ibaraki.jp
    kasumigaura.ibaraki.jp
    koga.ibaraki.jp
    miho.ibaraki.jp
    mito.ibaraki.jp
    moriya.ibaraki.jp
    naka.ibaraki.jp
    namegata.ibaraki.jp
    oarai.ibaraki.jp
    ogawa.ibaraki.jp
    omitama.ibaraki.jp
    ryugasaki.ibaraki.jp
    sakai.ibaraki.jp
    sakuragawa.ibaraki.jp
    shimodate.ibaraki.jp
    shimotsuma.ibaraki.jp
    shirosato.ibaraki.jp
    sowa.ibaraki.jp
    suifu.ibaraki.jp
    takahagi.ibaraki.jp
    tamatsukuri.ibaraki.jp
    tokai.ibaraki.jp
    tomobe.ibaraki.jp
    tone.ibaraki.jp
    toride.ibaraki.jp
    tsuchiura.ibaraki.jp
    tsukuba.ibaraki.jp
    uchihara.ibaraki.jp
    ushiku.ibaraki.jp
    yachiyo.ibaraki.jp
    yamagata.ibaraki.jp
    yawara.ibaraki.jp
    yuki.ibaraki.jp
    anamizu.ishikawa.jp
    hakui.ishikawa.jp
    hakusan.ishikawa.jp
    kaga.ishikawa.jp
    kahoku.ishikawa.jp
    kanazawa.ishikawa.jp
    kawakita.ishikawa.jp
    komatsu.ishikawa.jp
    nakanoto.ishikawa.jp
    nanao.ishikawa.jp
    nomi.ishikawa.jp
    nonoichi.ishikawa.jp
    noto.ishikawa.jp
    shika.ishikawa.jp
    suzu.ishikawa.jp
    tsubata.ishikawa.jp
    tsurugi.ishikawa.jp
    uchinada.ishikawa.jp
    wajima.ishikawa.jp
    fudai.iwate.jp
    fujisawa.iwate.jp
    hanamaki.iwate.jp
    hiraizumi.iwate.jp
    hirono.iwate.jp
    ichinohe.iwate.jp
    ichinoseki.iwate.jp
    iwaizumi.iwate.jp
    iwate.iwate.jp
    joboji.iwate.jp
    kamaishi.iwate.jp
    kanegasaki.iwate.jp
    karumai.iwate.jp
    kawai.iwate.jp
    kitakami.iwate.jp
    kuji.iwate.jp
    kunohe.iwate.jp
    kuzumaki.iwate.jp
    miyako.iwate.jp
    mizusawa.iwate.jp
    morioka.iwate.jp
    ninohe.iwate.jp
    noda.iwate.jp
    ofunato.iwate.jp
    oshu.iwate.jp
    otsuchi.iwate.jp
    rikuzentakata.iwate.jp
    shiwa.iwate.jp
    shizukuishi.iwate.jp
    sumita.iwate.jp
    tanohata.iwate.jp
    tono.iwate.jp
    yahaba.iwate.jp
    yamada.iwate.jp
    ayagawa.kagawa.jp
    higashikagawa.kagawa.jp
    kanonji.kagawa.jp
    kotohira.kagawa.jp
    manno.kagawa.jp
    marugame.kagawa.jp
    mitoyo.kagawa.jp
    naoshima.kagawa.jp
    sanuki.kagawa.jp
    tadotsu.kagawa.jp
    takamatsu.kagawa.jp
    tonosho.kagawa.jp
    uchinomi.kagawa.jp
    utazu.kagawa.jp
    zentsuji.kagawa.jp
    akune.kagoshima.jp
    amami.kagoshima.jp
    hioki.kagoshima.jp
    isa.kagoshima.jp
    isen.kagoshima.jp
    izumi.kagoshima.jp
    kagoshima.kagoshima.jp
    kanoya.kagoshima.jp
    kawanabe.kagoshima.jp
    kinko.kagoshima.jp
    kouyama.kagoshima.jp
    makurazaki.kagoshima.jp
    matsumoto.kagoshima.jp
    minamitane.kagoshima.jp
    nakatane.kagoshima.jp
    nishinoomote.kagoshima.jp
    satsumasendai.kagoshima.jp
    soo.kagoshima.jp
    tarumizu.kagoshima.jp
    yusui.kagoshima.jp
    aikawa.kanagawa.jp
    atsugi.kanagawa.jp
    ayase.kanagawa.jp
    chigasaki.kanagawa.jp
    ebina.kanagawa.jp
    fujisawa.kanagawa.jp
    hadano.kanagawa.jp
    hakone.kanagawa.jp
    hiratsuka.kanagawa.jp
    isehara.kanagawa.jp
    kaisei.kanagawa.jp
    kamakura.kanagawa.jp
    kiyokawa.kanagawa.jp
    matsuda.kanagawa.jp
    minamiashigara.kanagawa.jp
    miura.kanagawa.jp
    nakai.kanagawa.jp
    ninomiya.kanagawa.jp
    odawara.kanagawa.jp
    oi.kanagawa.jp
    oiso.kanagawa.jp
    sagamihara.kanagawa.jp
    samukawa.kanagawa.jp
    tsukui.kanagawa.jp
    yamakita.kanagawa.jp
    yamato.kanagawa.jp
    yokosuka.kanagawa.jp
    yugawara.kanagawa.jp
    zama.kanagawa.jp
    zushi.kanagawa.jp
    aki.kochi.jp
    geisei.kochi.jp
    hidaka.kochi.jp
    higashitsuno.kochi.jp
    ino.kochi.jp
    kagami.kochi.jp
    kami.kochi.jp
    kitagawa.kochi.jp
    kochi.kochi.jp
    mihara.kochi.jp
    motoyama.kochi.jp
    muroto.kochi.jp
    nahari.kochi.jp
    nakamura.kochi.jp
    nankoku.kochi.jp
    nishitosa.kochi.jp
    niyodogawa.kochi.jp
    ochi.kochi.jp
    okawa.kochi.jp
    otoyo.kochi.jp
    otsuki.kochi.jp
    sakawa.kochi.jp
    sukumo.kochi.jp
    susaki.kochi.jp
    tosa.kochi.jp
    tosashimizu.kochi.jp
    toyo.kochi.jp
    tsuno.kochi.jp
    umaji.kochi.jp
    yasuda.kochi.jp
    yusuhara.kochi.jp
    amakusa.kumamoto.jp
    arao.kumamoto.jp
    aso.kumamoto.jp
    choyo.kumamoto.jp
    gyokuto.kumamoto.jp
    kamiamakusa.kumamoto.jp
    kikuchi.kumamoto.jp
    kumamoto.kumamoto.jp
    mashiki.kumamoto.jp
    mifune.kumamoto.jp
    minamata.kumamoto.jp
    minamioguni.kumamoto.jp
    nagasu.kumamoto.jp
    nishihara.kumamoto.jp
    oguni.kumamoto.jp
    ozu.kumamoto.jp
    sumoto.kumamoto.jp
    takamori.kumamoto.jp
    uki.kumamoto.jp
    uto.kumamoto.jp
    yamaga.kumamoto.jp
    yamato.kumamoto.jp
    yatsushiro.kumamoto.jp
    ayabe.kyoto.jp
    fukuchiyama.kyoto.jp
    higashiyama.kyoto.jp
    ide.kyoto.jp
    ine.kyoto.jp
    joyo.kyoto.jp
    kameoka.kyoto.jp
    kamo.kyoto.jp
    kita.kyoto.jp
    kizu.kyoto.jp
    kumiyama.kyoto.jp
    kyotamba.kyoto.jp
    kyotanabe.kyoto.jp
    kyotango.kyoto.jp
    maizuru.kyoto.jp
    minami.kyoto.jp
    minamiyamashiro.kyoto.jp
    miyazu.kyoto.jp
    muko.kyoto.jp
    nagaokakyo.kyoto.jp
    nakagyo.kyoto.jp
    nantan.kyoto.jp
    oyamazaki.kyoto.jp
    sakyo.kyoto.jp
    seika.kyoto.jp
    tanabe.kyoto.jp
    uji.kyoto.jp
    ujitawara.kyoto.jp
    wazuka.kyoto.jp
    yamashina.kyoto.jp
    yawata.kyoto.jp
    asahi.mie.jp
    inabe.mie.jp
    ise.mie.jp
    kameyama.mie.jp
    kawagoe.mie.jp
    kiho.mie.jp
    kisosaki.mie.jp
    kiwa.mie.jp
    komono.mie.jp
    kumano.mie.jp
    kuwana.mie.jp
    matsusaka.mie.jp
    meiwa.mie.jp
    mihama.mie.jp
    minamiise.mie.jp
    misugi.mie.jp
    miyama.mie.jp
    nabari.mie.jp
    shima.mie.jp
    suzuka.mie.jp
    tado.mie.jp
    taiki.mie.jp
    taki.mie.jp
    tamaki.mie.jp
    toba.mie.jp
    tsu.mie.jp
    udono.mie.jp
    ureshino.mie.jp
    watarai.mie.jp
    yokkaichi.mie.jp
    furukawa.miyagi.jp
    higashimatsushima.miyagi.jp
    ishinomaki.miyagi.jp
    iwanuma.miyagi.jp
    kakuda.miyagi.jp
    kami.miyagi.jp
    kawasaki.miyagi.jp
    marumori.miyagi.jp
    matsushima.miyagi.jp
    minamisanriku.miyagi.jp
    misato.miyagi.jp
    murata.miyagi.jp
    natori.miyagi.jp
    ogawara.miyagi.jp
    ohira.miyagi.jp
    onagawa.miyagi.jp
    osaki.miyagi.jp
    rifu.miyagi.jp
    semine.miyagi.jp
    shibata.miyagi.jp
    shichikashuku.miyagi.jp
    shikama.miyagi.jp
    shiogama.miyagi.jp
    shiroishi.miyagi.jp
    tagajo.miyagi.jp
    taiwa.miyagi.jp
    tome.miyagi.jp
    tomiya.miyagi.jp
    wakuya.miyagi.jp
    watari.miyagi.jp
    yamamoto.miyagi.jp
    zao.miyagi.jp
    aya.miyazaki.jp
    ebino.miyazaki.jp
    gokase.miyazaki.jp
    hyuga.miyazaki.jp
    kadogawa.miyazaki.jp
    kawaminami.miyazaki.jp
    kijo.miyazaki.jp
    kitagawa.miyazaki.jp
    kitakata.miyazaki.jp
    kitaura.miyazaki.jp
    kobayashi.miyazaki.jp
    kunitomi.miyazaki.jp
    kushima.miyazaki.jp
    mimata.miyazaki.jp
    miyakonojo.miyazaki.jp
    miyazaki.miyazaki.jp
    morotsuka.miyazaki.jp
    nichinan.miyazaki.jp
    nishimera.miyazaki.jp
    nobeoka.miyazaki.jp
    saito.miyazaki.jp
    shiiba.miyazaki.jp
    shintomi.miyazaki.jp
    takaharu.miyazaki.jp
    takanabe.miyazaki.jp
    takazaki.miyazaki.jp
    tsuno.miyazaki.jp
    achi.nagano.jp
    agematsu.nagano.jp
    anan.nagano.jp
    aoki.nagano.jp
    asahi.nagano.jp
    azumino.nagano.jp
    chikuhoku.nagano.jp
    chikuma.nagano.jp
    chino.nagano.jp
    fujimi.nagano.jp
    hakuba.nagano.jp
    hara.nagano.jp
    hiraya.nagano.jp
    iida.nagano.jp
    iijima.nagano.jp
    iiyama.nagano.jp
    iizuna.nagano.jp
    ikeda.nagano.jp
    ikusaka.nagano.jp
    ina.nagano.jp
    karuizawa.nagano.jp
    kawakami.nagano.jp
    kiso.nagano.jp
    kisofukushima.nagano.jp
    kitaaiki.nagano.jp
    komagane.nagano.jp
    komoro.nagano.jp
    matsukawa.nagano.jp
    matsumoto.nagano.jp
    miasa.nagano.jp
    minamiaiki.nagano.jp
    minamimaki.nagano.jp
    minamiminowa.nagano.jp
    minowa.nagano.jp
    miyada.nagano.jp
    miyota.nagano.jp
    mochizuki.nagano.jp
    nagano.nagano.jp
    nagawa.nagano.jp
    nagiso.nagano.jp
    nakagawa.nagano.jp
    nakano.nagano.jp
    nozawaonsen.nagano.jp
    obuse.nagano.jp
    ogawa.nagano.jp
    okaya.nagano.jp
    omachi.nagano.jp
    omi.nagano.jp
    ookuwa.nagano.jp
    ooshika.nagano.jp
    otaki.nagano.jp
    otari.nagano.jp
    sakae.nagano.jp
    sakaki.nagano.jp
    saku.nagano.jp
    sakuho.nagano.jp
    shimosuwa.nagano.jp
    shinanomachi.nagano.jp
    shiojiri.nagano.jp
    suwa.nagano.jp
    suzaka.nagano.jp
    takagi.nagano.jp
    takamori.nagano.jp
    takayama.nagano.jp
    tateshina.nagano.jp
    tatsuno.nagano.jp
    togakushi.nagano.jp
    togura.nagano.jp
    tomi.nagano.jp
    ueda.nagano.jp
    wada.nagano.jp
    yamagata.nagano.jp
    yamanouchi.nagano.jp
    yasaka.nagano.jp
    yasuoka.nagano.jp
    chijiwa.nagasaki.jp
    futsu.nagasaki.jp
    goto.nagasaki.jp
    hasami.nagasaki.jp
    hirado.nagasaki.jp
    iki.nagasaki.jp
    isahaya.nagasaki.jp
    kawatana.nagasaki.jp
    kuchinotsu.nagasaki.jp
    matsuura.nagasaki.jp
    nagasaki.nagasaki.jp
    obama.nagasaki.jp
    omura.nagasaki.jp
    oseto.nagasaki.jp
    saikai.nagasaki.jp
    sasebo.nagasaki.jp
    seihi.nagasaki.jp
    shimabara.nagasaki.jp
    shinkamigoto.nagasaki.jp
    togitsu.nagasaki.jp
    tsushima.nagasaki.jp
    unzen.nagasaki.jp
    ando.nara.jp
    gose.nara.jp
    heguri.nara.jp
    higashiyoshino.nara.jp
    ikaruga.nara.jp
    ikoma.nara.jp
    kamikitayama.nara.jp
    kanmaki.nara.jp
    kashiba.nara.jp
    kashihara.nara.jp
    katsuragi.nara.jp
    kawai.nara.jp
    kawakami.nara.jp
    kawanishi.nara.jp
    koryo.nara.jp
    kurotaki.nara.jp
    mitsue.nara.jp
    miyake.nara.jp
    nara.nara.jp
    nosegawa.nara.jp
    oji.nara.jp
    ouda.nara.jp
    oyodo.nara.jp
    sakurai.nara.jp
    sango.nara.jp
    shimoichi.nara.jp
    shimokitayama.nara.jp
    shinjo.nara.jp
    soni.nara.jp
    takatori.nara.jp
    tawaramoto.nara.jp
    tenkawa.nara.jp
    tenri.nara.jp
    uda.nara.jp
    yamatokoriyama.nara.jp
    yamatotakada.nara.jp
    yamazoe.nara.jp
    yoshino.nara.jp
    aga.niigata.jp
    agano.niigata.jp
    gosen.niigata.jp
    itoigawa.niigata.jp
    izumozaki.niigata.jp
    joetsu.niigata.jp
    kamo.niigata.jp
    kariwa.niigata.jp
    kashiwazaki.niigata.jp
    minamiuonuma.niigata.jp
    mitsuke.niigata.jp
    muika.niigata.jp
    murakami.niigata.jp
    myoko.niigata.jp
    nagaoka.niigata.jp
    niigata.niigata.jp
    ojiya.niigata.jp
    omi.niigata.jp
    sado.niigata.jp
    sanjo.niigata.jp
    seiro.niigata.jp
    seirou.niigata.jp
    sekikawa.niigata.jp
    shibata.niigata.jp
    tagami.niigata.jp
    tainai.niigata.jp
    tochio.niigata.jp
    tokamachi.niigata.jp
    tsubame.niigata.jp
    tsunan.niigata.jp
    uonuma.niigata.jp
    yahiko.niigata.jp
    yoita.niigata.jp
    yuzawa.niigata.jp
    beppu.oita.jp
    bungoono.oita.jp
    bungotakada.oita.jp
    hasama.oita.jp
    hiji.oita.jp
    himeshima.oita.jp
    hita.oita.jp
    kamitsue.oita.jp
    kokonoe.oita.jp
    kuju.oita.jp
    kunisaki.oita.jp
    kusu.oita.jp
    oita.oita.jp
    saiki.oita.jp
    taketa.oita.jp
    tsukumi.oita.jp
    usa.oita.jp
    usuki.oita.jp
    yufu.oita.jp
    akaiwa.okayama.jp
    asakuchi.okayama.jp
    bizen.okayama.jp
    hayashima.okayama.jp
    ibara.okayama.jp
    kagamino.okayama.jp
    kasaoka.okayama.jp
    kibichuo.okayama.jp
    kumenan.okayama.jp
    kurashiki.okayama.jp
    maniwa.okayama.jp
    misaki.okayama.jp
    nagi.okayama.jp
    niimi.okayama.jp
    nishiawakura.okayama.jp
    okayama.okayama.jp
    satosho.okayama.jp
    setouchi.okayama.jp
    shinjo.okayama.jp
    shoo.okayama.jp
    soja.okayama.jp
    takahashi.okayama.jp
    tamano.okayama.jp
    tsuyama.okayama.jp
    wake.okayama.jp
    yakage.okayama.jp
    aguni.okinawa.jp
    ginowan.okinawa.jp
    ginoza.okinawa.jp
    gushikami.okinawa.jp
    haebaru.okinawa.jp
    higashi.okinawa.jp
    hirara.okinawa.jp
    iheya.okinawa.jp
    ishigaki.okinawa.jp
    ishikawa.okinawa.jp
    itoman.okinawa.jp
    izena.okinawa.jp
    kadena.okinawa.jp
    kin.okinawa.jp
    kitadaito.okinawa.jp
    kitanakagusuku.okinawa.jp
    kumejima.okinawa.jp
    kunigami.okinawa.jp
    minamidaito.okinawa.jp
    motobu.okinawa.jp
    nago.okinawa.jp
    naha.okinawa.jp
    nakagusuku.okinawa.jp
    nakijin.okinawa.jp
    nanjo.okinawa.jp
    nishihara.okinawa.jp
    ogimi.okinawa.jp
    okinawa.okinawa.jp
    onna.okinawa.jp
    shimoji.okinawa.jp
    taketomi.okinawa.jp
    tarama.okinawa.jp
    tokashiki.okinawa.jp
    tomigusuku.okinawa.jp
    tonaki.okinawa.jp
    urasoe.okinawa.jp
    uruma.okinawa.jp
    yaese.okinawa.jp
    yomitan.okinawa.jp
    yonabaru.okinawa.jp
    yonaguni.okinawa.jp
    zamami.okinawa.jp
    abeno.osaka.jp
    chihayaakasaka.osaka.jp
    chuo.osaka.jp
    daito.osaka.jp
    fujiidera.osaka.jp
    habikino.osaka.jp
    hannan.osaka.jp
    higashiosaka.osaka.jp
    higashisumiyoshi.osaka.jp
    higashiyodogawa.osaka.jp
    hirakata.osaka.jp
    ibaraki.osaka.jp
    ikeda.osaka.jp
    izumi.osaka.jp
    izumiotsu.osaka.jp
    izumisano.osaka.jp
    kadoma.osaka.jp
    kaizuka.osaka.jp
    kanan.osaka.jp
    kashiwara.osaka.jp
    katano.osaka.jp
    kawachinagano.osaka.jp
    kishiwada.osaka.jp
    kita.osaka.jp
    kumatori.osaka.jp
    matsubara.osaka.jp
    minato.osaka.jp
    minoh.osaka.jp
    misaki.osaka.jp
    moriguchi.osaka.jp
    neyagawa.osaka.jp
    nishi.osaka.jp
    nose.osaka.jp
    osakasayama.osaka.jp
    sakai.osaka.jp
    sayama.osaka.jp
    sennan.osaka.jp
    settsu.osaka.jp
    shijonawate.osaka.jp
    shimamoto.osaka.jp
    suita.osaka.jp
    tadaoka.osaka.jp
    taishi.osaka.jp
    tajiri.osaka.jp
    takaishi.osaka.jp
    takatsuki.osaka.jp
    tondabayashi.osaka.jp
    toyonaka.osaka.jp
    toyono.osaka.jp
    yao.osaka.jp
    ariake.saga.jp
    arita.saga.jp
    fukudomi.saga.jp
    genkai.saga.jp
    hamatama.saga.jp
    hizen.saga.jp
    imari.saga.jp
    kamimine.saga.jp
    kanzaki.saga.jp
    karatsu.saga.jp
    kashima.saga.jp
    kitagata.saga.jp
    kitahata.saga.jp
    kiyama.saga.jp
    kouhoku.saga.jp
    kyuragi.saga.jp
    nishiarita.saga.jp
    ogi.saga.jp
    omachi.saga.jp
    ouchi.saga.jp
    saga.saga.jp
    shiroishi.saga.jp
    taku.saga.jp
    tara.saga.jp
    tosu.saga.jp
    yoshinogari.saga.jp
    arakawa.saitama.jp
    asaka.saitama.jp
    chichibu.saitama.jp
    fujimi.saitama.jp
    fujimino.saitama.jp
    fukaya.saitama.jp
    hanno.saitama.jp
    hanyu.saitama.jp
    hasuda.saitama.jp
    hatogaya.saitama.jp
    hatoyama.saitama.jp
    hidaka.saitama.jp
    higashichichibu.saitama.jp
    higashimatsuyama.saitama.jp
    honjo.saitama.jp
    ina.saitama.jp
    iruma.saitama.jp
    iwatsuki.saitama.jp
    kamiizumi.saitama.jp
    kamikawa.saitama.jp
    kamisato.saitama.jp
    kasukabe.saitama.jp
    kawagoe.saitama.jp
    kawaguchi.saitama.jp
    kawajima.saitama.jp
    kazo.saitama.jp
    kitamoto.saitama.jp
    koshigaya.saitama.jp
    kounosu.saitama.jp
    kuki.saitama.jp
    kumagaya.saitama.jp
    matsubushi.saitama.jp
    minano.saitama.jp
    misato.saitama.jp
    miyashiro.saitama.jp
    miyoshi.saitama.jp
    moroyama.saitama.jp
    nagatoro.saitama.jp
    namegawa.saitama.jp
    niiza.saitama.jp
    ogano.saitama.jp
    ogawa.saitama.jp
    ogose.saitama.jp
    okegawa.saitama.jp
    omiya.saitama.jp
    otaki.saitama.jp
    ranzan.saitama.jp
    ryokami.saitama.jp
    saitama.saitama.jp
    sakado.saitama.jp
    satte.saitama.jp
    sayama.saitama.jp
    shiki.saitama.jp
    shiraoka.saitama.jp
    soka.saitama.jp
    sugito.saitama.jp
    toda.saitama.jp
    tokigawa.saitama.jp
    tokorozawa.saitama.jp
    tsurugashima.saitama.jp
    urawa.saitama.jp
    warabi.saitama.jp
    yashio.saitama.jp
    yokoze.saitama.jp
    yono.saitama.jp
    yorii.saitama.jp
    yoshida.saitama.jp
    yoshikawa.saitama.jp
    yoshimi.saitama.jp
    aisho.shiga.jp
    gamo.shiga.jp
    higashiomi.shiga.jp
    hikone.shiga.jp
    koka.shiga.jp
    konan.shiga.jp
    kosei.shiga.jp
    koto.shiga.jp
    kusatsu.shiga.jp
    maibara.shiga.jp
    moriyama.shiga.jp
    nagahama.shiga.jp
    nishiazai.shiga.jp
    notogawa.shiga.jp
    omihachiman.shiga.jp
    otsu.shiga.jp
    ritto.shiga.jp
    ryuoh.shiga.jp
    takashima.shiga.jp
    takatsuki.shiga.jp
    torahime.shiga.jp
    toyosato.shiga.jp
    yasu.shiga.jp
    akagi.shimane.jp
    ama.shimane.jp
    gotsu.shimane.jp
    hamada.shimane.jp
    higashiizumo.shimane.jp
    hikawa.shimane.jp
    hikimi.shimane.jp
    izumo.shimane.jp
    kakinoki.shimane.jp
    masuda.shimane.jp
    matsue.shimane.jp
    misato.shimane.jp
    nishinoshima.shimane.jp
    ohda.shimane.jp
    okinoshima.shimane.jp
    okuizumo.shimane.jp
    shimane.shimane.jp
    tamayu.shimane.jp
    tsuwano.shimane.jp
    unnan.shimane.jp
    yakumo.shimane.jp
    yasugi.shimane.jp
    yatsuka.shimane.jp
    arai.shizuoka.jp
    atami.shizuoka.jp
    fuji.shizuoka.jp
    fujieda.shizuoka.jp
    fujikawa.shizuoka.jp
    fujinomiya.shizuoka.jp
    fukuroi.shizuoka.jp
    gotemba.shizuoka.jp
    haibara.shizuoka.jp
    hamamatsu.shizuoka.jp
    higashiizu.shizuoka.jp
    ito.shizuoka.jp
    iwata.shizuoka.jp
    izu.shizuoka.jp
    izunokuni.shizuoka.jp
    kakegawa.shizuoka.jp
    kannami.shizuoka.jp
    kawanehon.shizuoka.jp
    kawazu.shizuoka.jp
    kikugawa.shizuoka.jp
    kosai.shizuoka.jp
    makinohara.shizuoka.jp
    matsuzaki.shizuoka.jp
    minamiizu.shizuoka.jp
    mishima.shizuoka.jp
    morimachi.shizuoka.jp
    nishiizu.shizuoka.jp
    numazu.shizuoka.jp
    omaezaki.shizuoka.jp
    shimada.shizuoka.jp
    shimizu.shizuoka.jp
    shimoda.shizuoka.jp
    shizuoka.shizuoka.jp
    susono.shizuoka.jp
    yaizu.shizuoka.jp
    yoshida.shizuoka.jp
    ashikaga.tochigi.jp
    bato.tochigi.jp
    haga.tochigi.jp
    ichikai.tochigi.jp
    iwafune.tochigi.jp
    kaminokawa.tochigi.jp
    kanuma.tochigi.jp
    karasuyama.tochigi.jp
    kuroiso.tochigi.jp
    mashiko.tochigi.jp
    mibu.tochigi.jp
    moka.tochigi.jp
    motegi.tochigi.jp
    nasu.tochigi.jp
    nasushiobara.tochigi.jp
    nikko.tochigi.jp
    nishikata.tochigi.jp
    nogi.tochigi.jp
    ohira.tochigi.jp
    ohtawara.tochigi.jp
    oyama.tochigi.jp
    sakura.tochigi.jp
    sano.tochigi.jp
    shimotsuke.tochigi.jp
    shioya.tochigi.jp
    takanezawa.tochigi.jp
    tochigi.tochigi.jp
    tsuga.tochigi.jp
    ujiie.tochigi.jp
    utsunomiya.tochigi.jp
    yaita.tochigi.jp
    aizumi.tokushima.jp
    anan.tokushima.jp
    ichiba.tokushima.jp
    itano.tokushima.jp
    kainan.tokushima.jp
    komatsushima.tokushima.jp
    matsushige.tokushima.jp
    mima.tokushima.jp
    minami.tokushima.jp
    miyoshi.tokushima.jp
    mugi.tokushima.jp
    nakagawa.tokushima.jp
    naruto.tokushima.jp
    sanagochi.tokushima.jp
    shishikui.tokushima.jp
    tokushima.tokushima.jp
    wajiki.tokushima.jp
    adachi.tokyo.jp
    akiruno.tokyo.jp
    akishima.tokyo.jp
    aogashima.tokyo.jp
    arakawa.tokyo.jp
    bunkyo.tokyo.jp
    chiyoda.tokyo.jp
    chofu.tokyo.jp
    chuo.tokyo.jp
    edogawa.tokyo.jp
    fuchu.tokyo.jp
    fussa.tokyo.jp
    hachijo.tokyo.jp
    hachioji.tokyo.jp
    hamura.tokyo.jp
    higashikurume.tokyo.jp
    higashimurayama.tokyo.jp
    higashiyamato.tokyo.jp
    hino.tokyo.jp
    hinode.tokyo.jp
    hinohara.tokyo.jp
    inagi.tokyo.jp
    itabashi.tokyo.jp
    katsushika.tokyo.jp
    kita.tokyo.jp
    kiyose.tokyo.jp
    kodaira.tokyo.jp
    koganei.tokyo.jp
    kokubunji.tokyo.jp
    komae.tokyo.jp
    koto.tokyo.jp
    kouzushima.tokyo.jp
    kunitachi.tokyo.jp
    machida.tokyo.jp
    meguro.tokyo.jp
    minato.tokyo.jp
    mitaka.tokyo.jp
    mizuho.tokyo.jp
    musashimurayama.tokyo.jp
    musashino.tokyo.jp
    nakano.tokyo.jp
    nerima.tokyo.jp
    ogasawara.tokyo.jp
    okutama.tokyo.jp
    ome.tokyo.jp
    oshima.tokyo.jp
    ota.tokyo.jp
    setagaya.tokyo.jp
    shibuya.tokyo.jp
    shinagawa.tokyo.jp
    shinjuku.tokyo.jp
    suginami.tokyo.jp
    sumida.tokyo.jp
    tachikawa.tokyo.jp
    taito.tokyo.jp
    tama.tokyo.jp
    toshima.tokyo.jp
    chizu.tottori.jp
    hino.tottori.jp
    kawahara.tottori.jp
    koge.tottori.jp
    kotoura.tottori.jp
    misasa.tottori.jp
    nanbu.tottori.jp
    nichinan.tottori.jp
    sakaiminato.tottori.jp
    tottori.tottori.jp
    wakasa.tottori.jp
    yazu.tottori.jp
    yonago.tottori.jp
    asahi.toyama.jp
    fuchu.toyama.jp
    fukumitsu.toyama.jp
    funahashi.toyama.jp
    himi.toyama.jp
    imizu.toyama.jp
    inami.toyama.jp
    johana.toyama.jp
    kamiichi.toyama.jp
    kurobe.toyama.jp
    nakaniikawa.toyama.jp
    namerikawa.toyama.jp
    nanto.toyama.jp
    nyuzen.toyama.jp
    oyabe.toyama.jp
    taira.toyama.jp
    takaoka.toyama.jp
    tateyama.toyama.jp
    toga.toyama.jp
    tonami.toyama.jp
    toyama.toyama.jp
    unazuki.toyama.jp
    uozu.toyama.jp
    yamada.toyama.jp
    arida.wakayama.jp
    aridagawa.wakayama.jp
    gobo.wakayama.jp
    hashimoto.wakayama.jp
    hidaka.wakayama.jp
    hirogawa.wakayama.jp
    inami.wakayama.jp
    iwade.wakayama.jp
    kainan.wakayama.jp
    kamitonda.wakayama.jp
    katsuragi.wakayama.jp
    kimino.wakayama.jp
    kinokawa.wakayama.jp
    kitayama.wakayama.jp
    koya.wakayama.jp
    koza.wakayama.jp
    kozagawa.wakayama.jp
    kudoyama.wakayama.jp
    kushimoto.wakayama.jp
    mihama.wakayama.jp
    misato.wakayama.jp
    nachikatsuura.wakayama.jp
    shingu.wakayama.jp
    shirahama.wakayama.jp
    taiji.wakayama.jp
    tanabe.wakayama.jp
    wakayama.wakayama.jp
    yuasa.wakayama.jp
    yura.wakayama.jp
    asahi.yamagata.jp
    funagata.yamagata.jp
    higashine.yamagata.jp
    iide.yamagata.jp
    kahoku.yamagata.jp
    kaminoyama.yamagata.jp
    kaneyama.yamagata.jp
    kawanishi.yamagata.jp
    mamurogawa.yamagata.jp
    mikawa.yamagata.jp
    murayama.yamagata.jp
    nagai.yamagata.jp
    nakayama.yamagata.jp
    nanyo.yamagata.jp
    nishikawa.yamagata.jp
    obanazawa.yamagata.jp
    oe.yamagata.jp
    oguni.yamagata.jp
    ohkura.yamagata.jp
    oishida.yamagata.jp
    sagae.yamagata.jp
    sakata.yamagata.jp
    sakegawa.yamagata.jp
    shinjo.yamagata.jp
    shirataka.yamagata.jp
    shonai.yamagata.jp
    takahata.yamagata.jp
    tendo.yamagata.jp
    tozawa.yamagata.jp
    tsuruoka.yamagata.jp
    yamagata.yamagata.jp
    yamanobe.yamagata.jp
    yonezawa.yamagata.jp
    yuza.yamagata.jp
    abu.yamaguchi.jp
    hagi.yamaguchi.jp
    hikari.yamaguchi.jp
    hofu.yamaguchi.jp
    iwakuni.yamaguchi.jp
    kudamatsu.yamaguchi.jp
    mitou.yamaguchi.jp
    nagato.yamaguchi.jp
    oshima.yamaguchi.jp
    shimonoseki.yamaguchi.jp
    shunan.yamaguchi.jp
    tabuse.yamaguchi.jp
    tokuyama.yamaguchi.jp
    toyota.yamaguchi.jp
    ube.yamaguchi.jp
    yuu.yamaguchi.jp
    chuo.yamanashi.jp
    doshi.yamanashi.jp
    fuefuki.yamanashi.jp
    fujikawa.yamanashi.jp
    fujikawaguchiko.yamanashi.jp
    fujiyoshida.yamanashi.jp
    hayakawa.yamanashi.jp
    hokuto.yamanashi.jp
    ichikawamisato.yamanashi.jp
    kai.yamanashi.jp
    kofu.yamanashi.jp
    koshu.yamanashi.jp
    kosuge.yamanashi.jp
    minami-alps.yamanashi.jp
    minobu.yamanashi.jp
    nakamichi.yamanashi.jp
    nanbu.yamanashi.jp
    narusawa.yamanashi.jp
    nirasaki.yamanashi.jp
    nishikatsura.yamanashi.jp
    oshino.yamanashi.jp
    otsuki.yamanashi.jp
    showa.yamanashi.jp
    tabayama.yamanashi.jp
    tsuru.yamanashi.jp
    uenohara.yamanashi.jp
    yamanakako.yamanashi.jp
    yamanashi.yamanashi.jp

    // ke : http://www.kenic.or.ke/index.php/en/ke-domains/ke-domains
    ke
    ac.ke
    co.ke
    go.ke
    info.ke
    me.ke
    mobi.ke
    ne.ke
    or.ke
    sc.ke

    // kg : http://www.domain.kg/dmn_n.html
    kg
    org.kg
    net.kg
    com.kg
    edu.kg
    gov.kg
    mil.kg

    // kh : http://www.mptc.gov.kh/dns_registration.htm
    *.kh

    // ki : http://www.ki/dns/index.html
    ki
    edu.ki
    biz.ki
    net.ki
    org.ki
    gov.ki
    info.ki
    com.ki

    // km : https://en.wikipedia.org/wiki/.km
    // http://www.domaine.km/documents/charte.doc
    km
    org.km
    nom.km
    gov.km
    prd.km
    tm.km
    edu.km
    mil.km
    ass.km
    com.km
    // These are only mentioned as proposed suggestions at domaine.km, but
    // https://en.wikipedia.org/wiki/.km says they're available for registration:
    coop.km
    asso.km
    presse.km
    medecin.km
    notaires.km
    pharmaciens.km
    veterinaire.km
    gouv.km

    // kn : https://en.wikipedia.org/wiki/.kn
    // http://www.dot.kn/domainRules.html
    kn
    net.kn
    org.kn
    edu.kn
    gov.kn

    // kp : http://www.kcce.kp/en_index.php
    kp
    com.kp
    edu.kp
    gov.kp
    org.kp
    rep.kp
    tra.kp

    // kr : https://en.wikipedia.org/wiki/.kr
    // see also: http://domain.nida.or.kr/eng/registration.jsp
    kr
    ac.kr
    co.kr
    es.kr
    go.kr
    hs.kr
    kg.kr
    mil.kr
    ms.kr
    ne.kr
    or.kr
    pe.kr
    re.kr
    sc.kr
    // kr geographical names
    busan.kr
    chungbuk.kr
    chungnam.kr
    daegu.kr
    daejeon.kr
    gangwon.kr
    gwangju.kr
    gyeongbuk.kr
    gyeonggi.kr
    gyeongnam.kr
    incheon.kr
    jeju.kr
    jeonbuk.kr
    jeonnam.kr
    seoul.kr
    ulsan.kr

    // kw : https://www.nic.kw/policies/
    // Confirmed by registry <nic.tech@citra.gov.kw>
    kw
    com.kw
    edu.kw
    emb.kw
    gov.kw
    ind.kw
    net.kw
    org.kw

    // ky : http://www.icta.ky/da_ky_reg_dom.php
    // Confirmed by registry <kysupport@perimeterusa.com> 2008-06-17
    ky
    com.ky
    edu.ky
    net.ky
    org.ky

    // kz : https://en.wikipedia.org/wiki/.kz
    // see also: http://www.nic.kz/rules/index.jsp
    kz
    org.kz
    edu.kz
    net.kz
    gov.kz
    mil.kz
    com.kz

    // la : https://en.wikipedia.org/wiki/.la
    // Submitted by registry <gavin.brown@nic.la>
    la
    int.la
    net.la
    info.la
    edu.la
    gov.la
    per.la
    com.la
    org.la

    // lb : https://en.wikipedia.org/wiki/.lb
    // Submitted by registry <randy@psg.com>
    lb
    com.lb
    edu.lb
    gov.lb
    net.lb
    org.lb

    // lc : https://en.wikipedia.org/wiki/.lc
    // see also: http://www.nic.lc/rules.htm
    lc
    com.lc
    net.lc
    co.lc
    org.lc
    edu.lc
    gov.lc

    // li : https://en.wikipedia.org/wiki/.li
    li

    // lk : https://www.nic.lk/index.php/domain-registration/lk-domain-naming-structure
    lk
    gov.lk
    sch.lk
    net.lk
    int.lk
    com.lk
    org.lk
    edu.lk
    ngo.lk
    soc.lk
    web.lk
    ltd.lk
    assn.lk
    grp.lk
    hotel.lk
    ac.lk

    // lr : http://psg.com/dns/lr/lr.txt
    // Submitted by registry <randy@psg.com>
    lr
    com.lr
    edu.lr
    gov.lr
    org.lr
    net.lr

    // ls : http://www.nic.ls/
    // Confirmed by registry <lsadmin@nic.ls>
    ls
    ac.ls
    biz.ls
    co.ls
    edu.ls
    gov.ls
    info.ls
    net.ls
    org.ls
    sc.ls

    // lt : https://en.wikipedia.org/wiki/.lt
    lt
    // gov.lt : http://www.gov.lt/index_en.php
    gov.lt

    // lu : http://www.dns.lu/en/
    lu

    // lv : http://www.nic.lv/DNS/En/generic.php
    lv
    com.lv
    edu.lv
    gov.lv
    org.lv
    mil.lv
    id.lv
    net.lv
    asn.lv
    conf.lv

    // ly : http://www.nic.ly/regulations.php
    ly
    com.ly
    net.ly
    gov.ly
    plc.ly
    edu.ly
    sch.ly
    med.ly
    org.ly
    id.ly

    // ma : https://en.wikipedia.org/wiki/.ma
    // http://www.anrt.ma/fr/admin/download/upload/file_fr782.pdf
    ma
    co.ma
    net.ma
    gov.ma
    org.ma
    ac.ma
    press.ma

    // mc : http://www.nic.mc/
    mc
    tm.mc
    asso.mc

    // md : https://en.wikipedia.org/wiki/.md
    md

    // me : https://en.wikipedia.org/wiki/.me
    me
    co.me
    net.me
    org.me
    edu.me
    ac.me
    gov.me
    its.me
    priv.me

    // mg : http://nic.mg/nicmg/?page_id=39
    mg
    org.mg
    nom.mg
    gov.mg
    prd.mg
    tm.mg
    edu.mg
    mil.mg
    com.mg
    co.mg

    // mh : https://en.wikipedia.org/wiki/.mh
    mh

    // mil : https://en.wikipedia.org/wiki/.mil
    mil

    // mk : https://en.wikipedia.org/wiki/.mk
    // see also: http://dns.marnet.net.mk/postapka.php
    mk
    com.mk
    org.mk
    net.mk
    edu.mk
    gov.mk
    inf.mk
    name.mk

    // ml : http://www.gobin.info/domainname/ml-template.doc
    // see also: https://en.wikipedia.org/wiki/.ml
    ml
    com.ml
    edu.ml
    gouv.ml
    gov.ml
    net.ml
    org.ml
    presse.ml

    // mm : https://en.wikipedia.org/wiki/.mm
    *.mm

    // mn : https://en.wikipedia.org/wiki/.mn
    mn
    gov.mn
    edu.mn
    org.mn

    // mo : http://www.monic.net.mo/
    mo
    com.mo
    net.mo
    org.mo
    edu.mo
    gov.mo

    // mobi : https://en.wikipedia.org/wiki/.mobi
    mobi

    // mp : http://www.dot.mp/
    // Confirmed by registry <dcamacho@saipan.com> 2008-06-17
    mp

    // mq : https://en.wikipedia.org/wiki/.mq
    mq

    // mr : https://en.wikipedia.org/wiki/.mr
    mr
    gov.mr

    // ms : http://www.nic.ms/pdf/MS_Domain_Name_Rules.pdf
    ms
    com.ms
    edu.ms
    gov.ms
    net.ms
    org.ms

    // mt : https://www.nic.org.mt/go/policy
    // Submitted by registry <help@nic.org.mt>
    mt
    com.mt
    edu.mt
    net.mt
    org.mt

    // mu : https://en.wikipedia.org/wiki/.mu
    mu
    com.mu
    net.mu
    org.mu
    gov.mu
    ac.mu
    co.mu
    or.mu

    // museum : http://about.museum/naming/
    // http://index.museum/
    museum
    academy.museum
    agriculture.museum
    air.museum
    airguard.museum
    alabama.museum
    alaska.museum
    amber.museum
    ambulance.museum
    american.museum
    americana.museum
    americanantiques.museum
    americanart.museum
    amsterdam.museum
    and.museum
    annefrank.museum
    anthro.museum
    anthropology.museum
    antiques.museum
    aquarium.museum
    arboretum.museum
    archaeological.museum
    archaeology.museum
    architecture.museum
    art.museum
    artanddesign.museum
    artcenter.museum
    artdeco.museum
    arteducation.museum
    artgallery.museum
    arts.museum
    artsandcrafts.museum
    asmatart.museum
    assassination.museum
    assisi.museum
    association.museum
    astronomy.museum
    atlanta.museum
    austin.museum
    australia.museum
    automotive.museum
    aviation.museum
    axis.museum
    badajoz.museum
    baghdad.museum
    bahn.museum
    bale.museum
    baltimore.museum
    barcelona.museum
    baseball.museum
    basel.museum
    baths.museum
    bauern.museum
    beauxarts.museum
    beeldengeluid.museum
    bellevue.museum
    bergbau.museum
    berkeley.museum
    berlin.museum
    bern.museum
    bible.museum
    bilbao.museum
    bill.museum
    birdart.museum
    birthplace.museum
    bonn.museum
    boston.museum
    botanical.museum
    botanicalgarden.museum
    botanicgarden.museum
    botany.museum
    brandywinevalley.museum
    brasil.museum
    bristol.museum
    british.museum
    britishcolumbia.museum
    broadcast.museum
    brunel.museum
    brussel.museum
    brussels.museum
    bruxelles.museum
    building.museum
    burghof.museum
    bus.museum
    bushey.museum
    cadaques.museum
    california.museum
    cambridge.museum
    can.museum
    canada.museum
    capebreton.museum
    carrier.museum
    cartoonart.museum
    casadelamoneda.museum
    castle.museum
    castres.museum
    celtic.museum
    center.museum
    chattanooga.museum
    cheltenham.museum
    chesapeakebay.museum
    chicago.museum
    children.museum
    childrens.museum
    childrensgarden.museum
    chiropractic.museum
    chocolate.museum
    christiansburg.museum
    cincinnati.museum
    cinema.museum
    circus.museum
    civilisation.museum
    civilization.museum
    civilwar.museum
    clinton.museum
    clock.museum
    coal.museum
    coastaldefence.museum
    cody.museum
    coldwar.museum
    collection.museum
    colonialwilliamsburg.museum
    coloradoplateau.museum
    columbia.museum
    columbus.museum
    communication.museum
    communications.museum
    community.museum
    computer.museum
    computerhistory.museum
    comunicações.museum
    contemporary.museum
    contemporaryart.museum
    convent.museum
    copenhagen.museum
    corporation.museum
    correios-e-telecomunicações.museum
    corvette.museum
    costume.museum
    countryestate.museum
    county.museum
    crafts.museum
    cranbrook.museum
    creation.museum
    cultural.museum
    culturalcenter.museum
    culture.museum
    cyber.museum
    cymru.museum
    dali.museum
    dallas.museum
    database.museum
    ddr.museum
    decorativearts.museum
    delaware.museum
    delmenhorst.museum
    denmark.museum
    depot.museum
    design.museum
    detroit.museum
    dinosaur.museum
    discovery.museum
    dolls.museum
    donostia.museum
    durham.museum
    eastafrica.museum
    eastcoast.museum
    education.museum
    educational.museum
    egyptian.museum
    eisenbahn.museum
    elburg.museum
    elvendrell.museum
    embroidery.museum
    encyclopedic.museum
    england.museum
    entomology.museum
    environment.museum
    environmentalconservation.museum
    epilepsy.museum
    essex.museum
    estate.museum
    ethnology.museum
    exeter.museum
    exhibition.museum
    family.museum
    farm.museum
    farmequipment.museum
    farmers.museum
    farmstead.museum
    field.museum
    figueres.museum
    filatelia.museum
    film.museum
    fineart.museum
    finearts.museum
    finland.museum
    flanders.museum
    florida.museum
    force.museum
    fortmissoula.museum
    fortworth.museum
    foundation.museum
    francaise.museum
    frankfurt.museum
    franziskaner.museum
    freemasonry.museum
    freiburg.museum
    fribourg.museum
    frog.museum
    fundacio.museum
    furniture.museum
    gallery.museum
    garden.museum
    gateway.museum
    geelvinck.museum
    gemological.museum
    geology.museum
    georgia.museum
    giessen.museum
    glas.museum
    glass.museum
    gorge.museum
    grandrapids.museum
    graz.museum
    guernsey.museum
    halloffame.museum
    hamburg.museum
    handson.museum
    harvestcelebration.museum
    hawaii.museum
    health.museum
    heimatunduhren.museum
    hellas.museum
    helsinki.museum
    hembygdsforbund.museum
    heritage.museum
    histoire.museum
    historical.museum
    historicalsociety.museum
    historichouses.museum
    historisch.museum
    historisches.museum
    history.museum
    historyofscience.museum
    horology.museum
    house.museum
    humanities.museum
    illustration.museum
    imageandsound.museum
    indian.museum
    indiana.museum
    indianapolis.museum
    indianmarket.museum
    intelligence.museum
    interactive.museum
    iraq.museum
    iron.museum
    isleofman.museum
    jamison.museum
    jefferson.museum
    jerusalem.museum
    jewelry.museum
    jewish.museum
    jewishart.museum
    jfk.museum
    journalism.museum
    judaica.museum
    judygarland.museum
    juedisches.museum
    juif.museum
    karate.museum
    karikatur.museum
    kids.museum
    koebenhavn.museum
    koeln.museum
    kunst.museum
    kunstsammlung.museum
    kunstunddesign.museum
    labor.museum
    labour.museum
    lajolla.museum
    lancashire.museum
    landes.museum
    lans.museum
    läns.museum
    larsson.museum
    lewismiller.museum
    lincoln.museum
    linz.museum
    living.museum
    livinghistory.museum
    localhistory.museum
    london.museum
    losangeles.museum
    louvre.museum
    loyalist.museum
    lucerne.museum
    luxembourg.museum
    luzern.museum
    mad.museum
    madrid.museum
    mallorca.museum
    manchester.museum
    mansion.museum
    mansions.museum
    manx.museum
    marburg.museum
    maritime.museum
    maritimo.museum
    maryland.museum
    marylhurst.museum
    media.museum
    medical.museum
    medizinhistorisches.museum
    meeres.museum
    memorial.museum
    mesaverde.museum
    michigan.museum
    midatlantic.museum
    military.museum
    mill.museum
    miners.museum
    mining.museum
    minnesota.museum
    missile.museum
    missoula.museum
    modern.museum
    moma.museum
    money.museum
    monmouth.museum
    monticello.museum
    montreal.museum
    moscow.museum
    motorcycle.museum
    muenchen.museum
    muenster.museum
    mulhouse.museum
    muncie.museum
    museet.museum
    museumcenter.museum
    museumvereniging.museum
    music.museum
    national.museum
    nationalfirearms.museum
    nationalheritage.museum
    nativeamerican.museum
    naturalhistory.museum
    naturalhistorymuseum.museum
    naturalsciences.museum
    nature.museum
    naturhistorisches.museum
    natuurwetenschappen.museum
    naumburg.museum
    naval.museum
    nebraska.museum
    neues.museum
    newhampshire.museum
    newjersey.museum
    newmexico.museum
    newport.museum
    newspaper.museum
    newyork.museum
    niepce.museum
    norfolk.museum
    north.museum
    nrw.museum
    nyc.museum
    nyny.museum
    oceanographic.museum
    oceanographique.museum
    omaha.museum
    online.museum
    ontario.museum
    openair.museum
    oregon.museum
    oregontrail.museum
    otago.museum
    oxford.museum
    pacific.museum
    paderborn.museum
    palace.museum
    paleo.museum
    palmsprings.museum
    panama.museum
    paris.museum
    pasadena.museum
    pharmacy.museum
    philadelphia.museum
    philadelphiaarea.museum
    philately.museum
    phoenix.museum
    photography.museum
    pilots.museum
    pittsburgh.museum
    planetarium.museum
    plantation.museum
    plants.museum
    plaza.museum
    portal.museum
    portland.museum
    portlligat.museum
    posts-and-telecommunications.museum
    preservation.museum
    presidio.museum
    press.museum
    project.museum
    public.museum
    pubol.museum
    quebec.museum
    railroad.museum
    railway.museum
    research.museum
    resistance.museum
    riodejaneiro.museum
    rochester.museum
    rockart.museum
    roma.museum
    russia.museum
    saintlouis.museum
    salem.museum
    salvadordali.museum
    salzburg.museum
    sandiego.museum
    sanfrancisco.museum
    santabarbara.museum
    santacruz.museum
    santafe.museum
    saskatchewan.museum
    satx.museum
    savannahga.museum
    schlesisches.museum
    schoenbrunn.museum
    schokoladen.museum
    school.museum
    schweiz.museum
    science.museum
    scienceandhistory.museum
    scienceandindustry.museum
    sciencecenter.museum
    sciencecenters.museum
    science-fiction.museum
    sciencehistory.museum
    sciences.museum
    sciencesnaturelles.museum
    scotland.museum
    seaport.museum
    settlement.museum
    settlers.museum
    shell.museum
    sherbrooke.museum
    sibenik.museum
    silk.museum
    ski.museum
    skole.museum
    society.museum
    sologne.museum
    soundandvision.museum
    southcarolina.museum
    southwest.museum
    space.museum
    spy.museum
    square.museum
    stadt.museum
    stalbans.museum
    starnberg.museum
    state.museum
    stateofdelaware.museum
    station.museum
    steam.museum
    steiermark.museum
    stjohn.museum
    stockholm.museum
    stpetersburg.museum
    stuttgart.museum
    suisse.museum
    surgeonshall.museum
    surrey.museum
    svizzera.museum
    sweden.museum
    sydney.museum
    tank.museum
    tcm.museum
    technology.museum
    telekommunikation.museum
    television.museum
    texas.museum
    textile.museum
    theater.museum
    time.museum
    timekeeping.museum
    topology.museum
    torino.museum
    touch.museum
    town.museum
    transport.museum
    tree.museum
    trolley.museum
    trust.museum
    trustee.museum
    uhren.museum
    ulm.museum
    undersea.museum
    university.museum
    usa.museum
    usantiques.museum
    usarts.museum
    uscountryestate.museum
    usculture.museum
    usdecorativearts.museum
    usgarden.museum
    ushistory.museum
    ushuaia.museum
    uslivinghistory.museum
    utah.museum
    uvic.museum
    valley.museum
    vantaa.museum
    versailles.museum
    viking.museum
    village.museum
    virginia.museum
    virtual.museum
    virtuel.museum
    vlaanderen.museum
    volkenkunde.museum
    wales.museum
    wallonie.museum
    war.museum
    washingtondc.museum
    watchandclock.museum
    watch-and-clock.museum
    western.museum
    westfalen.museum
    whaling.museum
    wildlife.museum
    williamsburg.museum
    windmill.museum
    workshop.museum
    york.museum
    yorkshire.museum
    yosemite.museum
    youth.museum
    zoological.museum
    zoology.museum
    ירושלים.museum
    иком.museum

    // mv : https://en.wikipedia.org/wiki/.mv
    // "mv" included because, contra Wikipedia, google.mv exists.
    mv
    aero.mv
    biz.mv
    com.mv
    coop.mv
    edu.mv
    gov.mv
    info.mv
    int.mv
    mil.mv
    museum.mv
    name.mv
    net.mv
    org.mv
    pro.mv

    // mw : http://www.registrar.mw/
    mw
    ac.mw
    biz.mw
    co.mw
    com.mw
    coop.mw
    edu.mw
    gov.mw
    int.mw
    museum.mw
    net.mw
    org.mw

    // mx : http://www.nic.mx/
    // Submitted by registry <farias@nic.mx>
    mx
    com.mx
    org.mx
    gob.mx
    edu.mx
    net.mx

    // my : http://www.mynic.my/
    // Available strings: https://mynic.my/resources/domains/buying-a-domain/
    my
    biz.my
    com.my
    edu.my
    gov.my
    mil.my
    name.my
    net.my
    org.my

    // mz : http://www.uem.mz/
    // Submitted by registry <antonio@uem.mz>
    mz
    ac.mz
    adv.mz
    co.mz
    edu.mz
    gov.mz
    mil.mz
    net.mz
    org.mz

    // na : http://www.na-nic.com.na/
    // http://www.info.na/domain/
    na
    info.na
    pro.na
    name.na
    school.na
    or.na
    dr.na
    us.na
    mx.na
    ca.na
    in.na
    cc.na
    tv.na
    ws.na
    mobi.na
    co.na
    com.na
    org.na

    // name : has 2nd-level tlds, but there's no list of them
    name

    // nc : http://www.cctld.nc/
    nc
    asso.nc
    nom.nc

    // ne : https://en.wikipedia.org/wiki/.ne
    ne

    // net : https://en.wikipedia.org/wiki/.net
    net

    // nf : https://en.wikipedia.org/wiki/.nf
    nf
    com.nf
    net.nf
    per.nf
    rec.nf
    web.nf
    arts.nf
    firm.nf
    info.nf
    other.nf
    store.nf

    // ng : http://www.nira.org.ng/index.php/join-us/register-ng-domain/189-nira-slds
    ng
    com.ng
    edu.ng
    gov.ng
    i.ng
    mil.ng
    mobi.ng
    name.ng
    net.ng
    org.ng
    sch.ng

    // ni : http://www.nic.ni/
    ni
    ac.ni
    biz.ni
    co.ni
    com.ni
    edu.ni
    gob.ni
    in.ni
    info.ni
    int.ni
    mil.ni
    net.ni
    nom.ni
    org.ni
    web.ni

    // nl : https://en.wikipedia.org/wiki/.nl
    //      https://www.sidn.nl/
    //      ccTLD for the Netherlands
    nl

    // no : https://www.norid.no/en/om-domenenavn/regelverk-for-no/
    // Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
    // Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
    // Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
    // RSS feed: https://teknisk.norid.no/en/feed/
    no
    // Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
    fhs.no
    vgs.no
    fylkesbibl.no
    folkebibl.no
    museum.no
    idrett.no
    priv.no
    // Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
    mil.no
    stat.no
    dep.no
    kommune.no
    herad.no
    // Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
    // counties
    aa.no
    ah.no
    bu.no
    fm.no
    hl.no
    hm.no
    jan-mayen.no
    mr.no
    nl.no
    nt.no
    of.no
    ol.no
    oslo.no
    rl.no
    sf.no
    st.no
    svalbard.no
    tm.no
    tr.no
    va.no
    vf.no
    // primary and lower secondary schools per county
    gs.aa.no
    gs.ah.no
    gs.bu.no
    gs.fm.no
    gs.hl.no
    gs.hm.no
    gs.jan-mayen.no
    gs.mr.no
    gs.nl.no
    gs.nt.no
    gs.of.no
    gs.ol.no
    gs.oslo.no
    gs.rl.no
    gs.sf.no
    gs.st.no
    gs.svalbard.no
    gs.tm.no
    gs.tr.no
    gs.va.no
    gs.vf.no
    // cities
    akrehamn.no
    åkrehamn.no
    algard.no
    ålgård.no
    arna.no
    brumunddal.no
    bryne.no
    bronnoysund.no
    brønnøysund.no
    drobak.no
    drøbak.no
    egersund.no
    fetsund.no
    floro.no
    florø.no
    fredrikstad.no
    hokksund.no
    honefoss.no
    hønefoss.no
    jessheim.no
    jorpeland.no
    jørpeland.no
    kirkenes.no
    kopervik.no
    krokstadelva.no
    langevag.no
    langevåg.no
    leirvik.no
    mjondalen.no
    mjøndalen.no
    mo-i-rana.no
    mosjoen.no
    mosjøen.no
    nesoddtangen.no
    orkanger.no
    osoyro.no
    osøyro.no
    raholt.no
    råholt.no
    sandnessjoen.no
    sandnessjøen.no
    skedsmokorset.no
    slattum.no
    spjelkavik.no
    stathelle.no
    stavern.no
    stjordalshalsen.no
    stjørdalshalsen.no
    tananger.no
    tranby.no
    vossevangen.no
    // communities
    afjord.no
    åfjord.no
    agdenes.no
    al.no
    ål.no
    alesund.no
    ålesund.no
    alstahaug.no
    alta.no
    áltá.no
    alaheadju.no
    álaheadju.no
    alvdal.no
    amli.no
    åmli.no
    amot.no
    åmot.no
    andebu.no
    andoy.no
    andøy.no
    andasuolo.no
    ardal.no
    årdal.no
    aremark.no
    arendal.no
    ås.no
    aseral.no
    åseral.no
    asker.no
    askim.no
    askvoll.no
    askoy.no
    askøy.no
    asnes.no
    åsnes.no
    audnedaln.no
    aukra.no
    aure.no
    aurland.no
    aurskog-holand.no
    aurskog-høland.no
    austevoll.no
    austrheim.no
    averoy.no
    averøy.no
    balestrand.no
    ballangen.no
    balat.no
    bálát.no
    balsfjord.no
    bahccavuotna.no
    báhccavuotna.no
    bamble.no
    bardu.no
    beardu.no
    beiarn.no
    bajddar.no
    bájddar.no
    baidar.no
    báidár.no
    berg.no
    bergen.no
    berlevag.no
    berlevåg.no
    bearalvahki.no
    bearalváhki.no
    bindal.no
    birkenes.no
    bjarkoy.no
    bjarkøy.no
    bjerkreim.no
    bjugn.no
    bodo.no
    bodø.no
    badaddja.no
    bådåddjå.no
    budejju.no
    bokn.no
    bremanger.no
    bronnoy.no
    brønnøy.no
    bygland.no
    bykle.no
    barum.no
    bærum.no
    bo.telemark.no
    bø.telemark.no
    bo.nordland.no
    bø.nordland.no
    bievat.no
    bievát.no
    bomlo.no
    bømlo.no
    batsfjord.no
    båtsfjord.no
    bahcavuotna.no
    báhcavuotna.no
    dovre.no
    drammen.no
    drangedal.no
    dyroy.no
    dyrøy.no
    donna.no
    dønna.no
    eid.no
    eidfjord.no
    eidsberg.no
    eidskog.no
    eidsvoll.no
    eigersund.no
    elverum.no
    enebakk.no
    engerdal.no
    etne.no
    etnedal.no
    evenes.no
    evenassi.no
    evenášši.no
    evje-og-hornnes.no
    farsund.no
    fauske.no
    fuossko.no
    fuoisku.no
    fedje.no
    fet.no
    finnoy.no
    finnøy.no
    fitjar.no
    fjaler.no
    fjell.no
    flakstad.no
    flatanger.no
    flekkefjord.no
    flesberg.no
    flora.no
    fla.no
    flå.no
    folldal.no
    forsand.no
    fosnes.no
    frei.no
    frogn.no
    froland.no
    frosta.no
    frana.no
    fræna.no
    froya.no
    frøya.no
    fusa.no
    fyresdal.no
    forde.no
    førde.no
    gamvik.no
    gangaviika.no
    gáŋgaviika.no
    gaular.no
    gausdal.no
    gildeskal.no
    gildeskål.no
    giske.no
    gjemnes.no
    gjerdrum.no
    gjerstad.no
    gjesdal.no
    gjovik.no
    gjøvik.no
    gloppen.no
    gol.no
    gran.no
    grane.no
    granvin.no
    gratangen.no
    grimstad.no
    grong.no
    kraanghke.no
    kråanghke.no
    grue.no
    gulen.no
    hadsel.no
    halden.no
    halsa.no
    hamar.no
    hamaroy.no
    habmer.no
    hábmer.no
    hapmir.no
    hápmir.no
    hammerfest.no
    hammarfeasta.no
    hámmárfeasta.no
    haram.no
    hareid.no
    harstad.no
    hasvik.no
    aknoluokta.no
    ákŋoluokta.no
    hattfjelldal.no
    aarborte.no
    haugesund.no
    hemne.no
    hemnes.no
    hemsedal.no
    heroy.more-og-romsdal.no
    herøy.møre-og-romsdal.no
    heroy.nordland.no
    herøy.nordland.no
    hitra.no
    hjartdal.no
    hjelmeland.no
    hobol.no
    hobøl.no
    hof.no
    hol.no
    hole.no
    holmestrand.no
    holtalen.no
    holtålen.no
    hornindal.no
    horten.no
    hurdal.no
    hurum.no
    hvaler.no
    hyllestad.no
    hagebostad.no
    hægebostad.no
    hoyanger.no
    høyanger.no
    hoylandet.no
    høylandet.no
    ha.no
    hå.no
    ibestad.no
    inderoy.no
    inderøy.no
    iveland.no
    jevnaker.no
    jondal.no
    jolster.no
    jølster.no
    karasjok.no
    karasjohka.no
    kárášjohka.no
    karlsoy.no
    galsa.no
    gálsá.no
    karmoy.no
    karmøy.no
    kautokeino.no
    guovdageaidnu.no
    klepp.no
    klabu.no
    klæbu.no
    kongsberg.no
    kongsvinger.no
    kragero.no
    kragerø.no
    kristiansand.no
    kristiansund.no
    krodsherad.no
    krødsherad.no
    kvalsund.no
    rahkkeravju.no
    ráhkkerávju.no
    kvam.no
    kvinesdal.no
    kvinnherad.no
    kviteseid.no
    kvitsoy.no
    kvitsøy.no
    kvafjord.no
    kvæfjord.no
    giehtavuoatna.no
    kvanangen.no
    kvænangen.no
    navuotna.no
    návuotna.no
    kafjord.no
    kåfjord.no
    gaivuotna.no
    gáivuotna.no
    larvik.no
    lavangen.no
    lavagis.no
    loabat.no
    loabát.no
    lebesby.no
    davvesiida.no
    leikanger.no
    leirfjord.no
    leka.no
    leksvik.no
    lenvik.no
    leangaviika.no
    leaŋgaviika.no
    lesja.no
    levanger.no
    lier.no
    lierne.no
    lillehammer.no
    lillesand.no
    lindesnes.no
    lindas.no
    lindås.no
    lom.no
    loppa.no
    lahppi.no
    láhppi.no
    lund.no
    lunner.no
    luroy.no
    lurøy.no
    luster.no
    lyngdal.no
    lyngen.no
    ivgu.no
    lardal.no
    lerdal.no
    lærdal.no
    lodingen.no
    lødingen.no
    lorenskog.no
    lørenskog.no
    loten.no
    løten.no
    malvik.no
    masoy.no
    måsøy.no
    muosat.no
    muosát.no
    mandal.no
    marker.no
    marnardal.no
    masfjorden.no
    meland.no
    meldal.no
    melhus.no
    meloy.no
    meløy.no
    meraker.no
    meråker.no
    moareke.no
    moåreke.no
    midsund.no
    midtre-gauldal.no
    modalen.no
    modum.no
    molde.no
    moskenes.no
    moss.no
    mosvik.no
    malselv.no
    målselv.no
    malatvuopmi.no
    málatvuopmi.no
    namdalseid.no
    aejrie.no
    namsos.no
    namsskogan.no
    naamesjevuemie.no
    nååmesjevuemie.no
    laakesvuemie.no
    nannestad.no
    narvik.no
    narviika.no
    naustdal.no
    nedre-eiker.no
    nes.akershus.no
    nes.buskerud.no
    nesna.no
    nesodden.no
    nesseby.no
    unjarga.no
    unjárga.no
    nesset.no
    nissedal.no
    nittedal.no
    nord-aurdal.no
    nord-fron.no
    nord-odal.no
    norddal.no
    nordkapp.no
    davvenjarga.no
    davvenjárga.no
    nordre-land.no
    nordreisa.no
    raisa.no
    ráisa.no
    nore-og-uvdal.no
    notodden.no
    naroy.no
    nærøy.no
    notteroy.no
    nøtterøy.no
    odda.no
    oksnes.no
    øksnes.no
    oppdal.no
    oppegard.no
    oppegård.no
    orkdal.no
    orland.no
    ørland.no
    orskog.no
    ørskog.no
    orsta.no
    ørsta.no
    os.hedmark.no
    os.hordaland.no
    osen.no
    osteroy.no
    osterøy.no
    ostre-toten.no
    østre-toten.no
    overhalla.no
    ovre-eiker.no
    øvre-eiker.no
    oyer.no
    øyer.no
    oygarden.no
    øygarden.no
    oystre-slidre.no
    øystre-slidre.no
    porsanger.no
    porsangu.no
    porsáŋgu.no
    porsgrunn.no
    radoy.no
    radøy.no
    rakkestad.no
    rana.no
    ruovat.no
    randaberg.no
    rauma.no
    rendalen.no
    rennebu.no
    rennesoy.no
    rennesøy.no
    rindal.no
    ringebu.no
    ringerike.no
    ringsaker.no
    rissa.no
    risor.no
    risør.no
    roan.no
    rollag.no
    rygge.no
    ralingen.no
    rælingen.no
    rodoy.no
    rødøy.no
    romskog.no
    rømskog.no
    roros.no
    røros.no
    rost.no
    røst.no
    royken.no
    røyken.no
    royrvik.no
    røyrvik.no
    rade.no
    råde.no
    salangen.no
    siellak.no
    saltdal.no
    salat.no
    sálát.no
    sálat.no
    samnanger.no
    sande.more-og-romsdal.no
    sande.møre-og-romsdal.no
    sande.vestfold.no
    sandefjord.no
    sandnes.no
    sandoy.no
    sandøy.no
    sarpsborg.no
    sauda.no
    sauherad.no
    sel.no
    selbu.no
    selje.no
    seljord.no
    sigdal.no
    siljan.no
    sirdal.no
    skaun.no
    skedsmo.no
    ski.no
    skien.no
    skiptvet.no
    skjervoy.no
    skjervøy.no
    skierva.no
    skiervá.no
    skjak.no
    skjåk.no
    skodje.no
    skanland.no
    skånland.no
    skanit.no
    skánit.no
    smola.no
    smøla.no
    snillfjord.no
    snasa.no
    snåsa.no
    snoasa.no
    snaase.no
    snåase.no
    sogndal.no
    sokndal.no
    sola.no
    solund.no
    songdalen.no
    sortland.no
    spydeberg.no
    stange.no
    stavanger.no
    steigen.no
    steinkjer.no
    stjordal.no
    stjørdal.no
    stokke.no
    stor-elvdal.no
    stord.no
    stordal.no
    storfjord.no
    omasvuotna.no
    strand.no
    stranda.no
    stryn.no
    sula.no
    suldal.no
    sund.no
    sunndal.no
    surnadal.no
    sveio.no
    svelvik.no
    sykkylven.no
    sogne.no
    søgne.no
    somna.no
    sømna.no
    sondre-land.no
    søndre-land.no
    sor-aurdal.no
    sør-aurdal.no
    sor-fron.no
    sør-fron.no
    sor-odal.no
    sør-odal.no
    sor-varanger.no
    sør-varanger.no
    matta-varjjat.no
    mátta-várjjat.no
    sorfold.no
    sørfold.no
    sorreisa.no
    sørreisa.no
    sorum.no
    sørum.no
    tana.no
    deatnu.no
    time.no
    tingvoll.no
    tinn.no
    tjeldsund.no
    dielddanuorri.no
    tjome.no
    tjøme.no
    tokke.no
    tolga.no
    torsken.no
    tranoy.no
    tranøy.no
    tromso.no
    tromsø.no
    tromsa.no
    romsa.no
    trondheim.no
    troandin.no
    trysil.no
    trana.no
    træna.no
    trogstad.no
    trøgstad.no
    tvedestrand.no
    tydal.no
    tynset.no
    tysfjord.no
    divtasvuodna.no
    divttasvuotna.no
    tysnes.no
    tysvar.no
    tysvær.no
    tonsberg.no
    tønsberg.no
    ullensaker.no
    ullensvang.no
    ulvik.no
    utsira.no
    vadso.no
    vadsø.no
    cahcesuolo.no
    čáhcesuolo.no
    vaksdal.no
    valle.no
    vang.no
    vanylven.no
    vardo.no
    vardø.no
    varggat.no
    várggát.no
    vefsn.no
    vaapste.no
    vega.no
    vegarshei.no
    vegårshei.no
    vennesla.no
    verdal.no
    verran.no
    vestby.no
    vestnes.no
    vestre-slidre.no
    vestre-toten.no
    vestvagoy.no
    vestvågøy.no
    vevelstad.no
    vik.no
    vikna.no
    vindafjord.no
    volda.no
    voss.no
    varoy.no
    værøy.no
    vagan.no
    vågan.no
    voagat.no
    vagsoy.no
    vågsøy.no
    vaga.no
    vågå.no
    valer.ostfold.no
    våler.østfold.no
    valer.hedmark.no
    våler.hedmark.no

    // np : http://www.mos.com.np/register.html
    *.np

    // nr : http://cenpac.net.nr/dns/index.html
    // Submitted by registry <technician@cenpac.net.nr>
    nr
    biz.nr
    info.nr
    gov.nr
    edu.nr
    org.nr
    net.nr
    com.nr

    // nu : https://en.wikipedia.org/wiki/.nu
    nu

    // nz : https://en.wikipedia.org/wiki/.nz
    // Submitted by registry <jay@nzrs.net.nz>
    nz
    ac.nz
    co.nz
    cri.nz
    geek.nz
    gen.nz
    govt.nz
    health.nz
    iwi.nz
    kiwi.nz
    maori.nz
    mil.nz
    māori.nz
    net.nz
    org.nz
    parliament.nz
    school.nz

    // om : https://en.wikipedia.org/wiki/.om
    om
    co.om
    com.om
    edu.om
    gov.om
    med.om
    museum.om
    net.om
    org.om
    pro.om

    // onion : https://tools.ietf.org/html/rfc7686
    onion

    // org : https://en.wikipedia.org/wiki/.org
    org

    // pa : http://www.nic.pa/
    // Some additional second level "domains" resolve directly as hostnames, such as
    // pannet.pa, so we add a rule for "pa".
    pa
    ac.pa
    gob.pa
    com.pa
    org.pa
    sld.pa
    edu.pa
    net.pa
    ing.pa
    abo.pa
    med.pa
    nom.pa

    // pe : https://www.nic.pe/InformeFinalComision.pdf
    pe
    edu.pe
    gob.pe
    nom.pe
    mil.pe
    org.pe
    com.pe
    net.pe

    // pf : http://www.gobin.info/domainname/formulaire-pf.pdf
    pf
    com.pf
    org.pf
    edu.pf

    // pg : https://en.wikipedia.org/wiki/.pg
    *.pg

    // ph : http://www.domains.ph/FAQ2.asp
    // Submitted by registry <jed@email.com.ph>
    ph
    com.ph
    net.ph
    org.ph
    gov.ph
    edu.ph
    ngo.ph
    mil.ph
    i.ph

    // pk : http://pk5.pknic.net.pk/pk5/msgNamepk.PK
    pk
    com.pk
    net.pk
    edu.pk
    org.pk
    fam.pk
    biz.pk
    web.pk
    gov.pk
    gob.pk
    gok.pk
    gon.pk
    gop.pk
    gos.pk
    info.pk

    // pl http://www.dns.pl/english/index.html
    // Submitted by registry
    pl
    com.pl
    net.pl
    org.pl
    // pl functional domains (http://www.dns.pl/english/index.html)
    aid.pl
    agro.pl
    atm.pl
    auto.pl
    biz.pl
    edu.pl
    gmina.pl
    gsm.pl
    info.pl
    mail.pl
    miasta.pl
    media.pl
    mil.pl
    nieruchomosci.pl
    nom.pl
    pc.pl
    powiat.pl
    priv.pl
    realestate.pl
    rel.pl
    sex.pl
    shop.pl
    sklep.pl
    sos.pl
    szkola.pl
    targi.pl
    tm.pl
    tourism.pl
    travel.pl
    turystyka.pl
    // Government domains
    gov.pl
    ap.gov.pl
    ic.gov.pl
    is.gov.pl
    us.gov.pl
    kmpsp.gov.pl
    kppsp.gov.pl
    kwpsp.gov.pl
    psp.gov.pl
    wskr.gov.pl
    kwp.gov.pl
    mw.gov.pl
    ug.gov.pl
    um.gov.pl
    umig.gov.pl
    ugim.gov.pl
    upow.gov.pl
    uw.gov.pl
    starostwo.gov.pl
    pa.gov.pl
    po.gov.pl
    psse.gov.pl
    pup.gov.pl
    rzgw.gov.pl
    sa.gov.pl
    so.gov.pl
    sr.gov.pl
    wsa.gov.pl
    sko.gov.pl
    uzs.gov.pl
    wiih.gov.pl
    winb.gov.pl
    pinb.gov.pl
    wios.gov.pl
    witd.gov.pl
    wzmiuw.gov.pl
    piw.gov.pl
    wiw.gov.pl
    griw.gov.pl
    wif.gov.pl
    oum.gov.pl
    sdn.gov.pl
    zp.gov.pl
    uppo.gov.pl
    mup.gov.pl
    wuoz.gov.pl
    konsulat.gov.pl
    oirm.gov.pl
    // pl regional domains (http://www.dns.pl/english/index.html)
    augustow.pl
    babia-gora.pl
    bedzin.pl
    beskidy.pl
    bialowieza.pl
    bialystok.pl
    bielawa.pl
    bieszczady.pl
    boleslawiec.pl
    bydgoszcz.pl
    bytom.pl
    cieszyn.pl
    czeladz.pl
    czest.pl
    dlugoleka.pl
    elblag.pl
    elk.pl
    glogow.pl
    gniezno.pl
    gorlice.pl
    grajewo.pl
    ilawa.pl
    jaworzno.pl
    jelenia-gora.pl
    jgora.pl
    kalisz.pl
    kazimierz-dolny.pl
    karpacz.pl
    kartuzy.pl
    kaszuby.pl
    katowice.pl
    kepno.pl
    ketrzyn.pl
    klodzko.pl
    kobierzyce.pl
    kolobrzeg.pl
    konin.pl
    konskowola.pl
    kutno.pl
    lapy.pl
    lebork.pl
    legnica.pl
    lezajsk.pl
    limanowa.pl
    lomza.pl
    lowicz.pl
    lubin.pl
    lukow.pl
    malbork.pl
    malopolska.pl
    mazowsze.pl
    mazury.pl
    mielec.pl
    mielno.pl
    mragowo.pl
    naklo.pl
    nowaruda.pl
    nysa.pl
    olawa.pl
    olecko.pl
    olkusz.pl
    olsztyn.pl
    opoczno.pl
    opole.pl
    ostroda.pl
    ostroleka.pl
    ostrowiec.pl
    ostrowwlkp.pl
    pila.pl
    pisz.pl
    podhale.pl
    podlasie.pl
    polkowice.pl
    pomorze.pl
    pomorskie.pl
    prochowice.pl
    pruszkow.pl
    przeworsk.pl
    pulawy.pl
    radom.pl
    rawa-maz.pl
    rybnik.pl
    rzeszow.pl
    sanok.pl
    sejny.pl
    slask.pl
    slupsk.pl
    sosnowiec.pl
    stalowa-wola.pl
    skoczow.pl
    starachowice.pl
    stargard.pl
    suwalki.pl
    swidnica.pl
    swiebodzin.pl
    swinoujscie.pl
    szczecin.pl
    szczytno.pl
    tarnobrzeg.pl
    tgory.pl
    turek.pl
    tychy.pl
    ustka.pl
    walbrzych.pl
    warmia.pl
    warszawa.pl
    waw.pl
    wegrow.pl
    wielun.pl
    wlocl.pl
    wloclawek.pl
    wodzislaw.pl
    wolomin.pl
    wroclaw.pl
    zachpomor.pl
    zagan.pl
    zarow.pl
    zgora.pl
    zgorzelec.pl

    // pm : http://www.afnic.fr/medias/documents/AFNIC-naming-policy2012.pdf
    pm

    // pn : http://www.government.pn/PnRegistry/policies.htm
    pn
    gov.pn
    co.pn
    org.pn
    edu.pn
    net.pn

    // post : https://en.wikipedia.org/wiki/.post
    post

    // pr : http://www.nic.pr/index.asp?f=1
    pr
    com.pr
    net.pr
    org.pr
    gov.pr
    edu.pr
    isla.pr
    pro.pr
    biz.pr
    info.pr
    name.pr
    // these aren't mentioned on nic.pr, but on https://en.wikipedia.org/wiki/.pr
    est.pr
    prof.pr
    ac.pr

    // pro : http://registry.pro/get-pro
    pro
    aaa.pro
    aca.pro
    acct.pro
    avocat.pro
    bar.pro
    cpa.pro
    eng.pro
    jur.pro
    law.pro
    med.pro
    recht.pro

    // ps : https://en.wikipedia.org/wiki/.ps
    // http://www.nic.ps/registration/policy.html#reg
    ps
    edu.ps
    gov.ps
    sec.ps
    plo.ps
    com.ps
    org.ps
    net.ps

    // pt : https://www.dns.pt/en/domain/pt-terms-and-conditions-registration-rules/
    pt
    net.pt
    gov.pt
    org.pt
    edu.pt
    int.pt
    publ.pt
    com.pt
    nome.pt

    // pw : https://en.wikipedia.org/wiki/.pw
    pw
    co.pw
    ne.pw
    or.pw
    ed.pw
    go.pw
    belau.pw

    // py : http://www.nic.py/pautas.html#seccion_9
    // Submitted by registry
    py
    com.py
    coop.py
    edu.py
    gov.py
    mil.py
    net.py
    org.py

    // qa : http://domains.qa/en/
    qa
    com.qa
    edu.qa
    gov.qa
    mil.qa
    name.qa
    net.qa
    org.qa
    sch.qa

    // re : http://www.afnic.re/obtenir/chartes/nommage-re/annexe-descriptifs
    re
    asso.re
    com.re
    nom.re

    // ro : http://www.rotld.ro/
    ro
    arts.ro
    com.ro
    firm.ro
    info.ro
    nom.ro
    nt.ro
    org.ro
    rec.ro
    store.ro
    tm.ro
    www.ro

    // rs : https://www.rnids.rs/en/domains/national-domains
    rs
    ac.rs
    co.rs
    edu.rs
    gov.rs
    in.rs
    org.rs

    // ru : https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
    // Submitted by George Georgievsky <gug@cctld.ru>
    ru

    // rw : https://www.ricta.org.rw/sites/default/files/resources/registry_registrar_contract_0.pdf
    rw
    ac.rw
    co.rw
    coop.rw
    gov.rw
    mil.rw
    net.rw
    org.rw

    // sa : http://www.nic.net.sa/
    sa
    com.sa
    net.sa
    org.sa
    gov.sa
    med.sa
    pub.sa
    edu.sa
    sch.sa

    // sb : http://www.sbnic.net.sb/
    // Submitted by registry <lee.humphries@telekom.com.sb>
    sb
    com.sb
    edu.sb
    gov.sb
    net.sb
    org.sb

    // sc : http://www.nic.sc/
    sc
    com.sc
    gov.sc
    net.sc
    org.sc
    edu.sc

    // sd : http://www.isoc.sd/sudanic.isoc.sd/billing_pricing.htm
    // Submitted by registry <admin@isoc.sd>
    sd
    com.sd
    net.sd
    org.sd
    edu.sd
    med.sd
    tv.sd
    gov.sd
    info.sd

    // se : https://en.wikipedia.org/wiki/.se
    // Submitted by registry <patrik.wallstrom@iis.se>
    se
    a.se
    ac.se
    b.se
    bd.se
    brand.se
    c.se
    d.se
    e.se
    f.se
    fh.se
    fhsk.se
    fhv.se
    g.se
    h.se
    i.se
    k.se
    komforb.se
    kommunalforbund.se
    komvux.se
    l.se
    lanbib.se
    m.se
    n.se
    naturbruksgymn.se
    o.se
    org.se
    p.se
    parti.se
    pp.se
    press.se
    r.se
    s.se
    t.se
    tm.se
    u.se
    w.se
    x.se
    y.se
    z.se

    // sg : http://www.nic.net.sg/page/registration-policies-procedures-and-guidelines
    sg
    com.sg
    net.sg
    org.sg
    gov.sg
    edu.sg
    per.sg

    // sh : http://nic.sh/rules.htm
    sh
    com.sh
    net.sh
    gov.sh
    org.sh
    mil.sh

    // si : https://en.wikipedia.org/wiki/.si
    si

    // sj : No registrations at this time.
    // Submitted by registry <jarle@uninett.no>
    sj

    // sk : https://en.wikipedia.org/wiki/.sk
    // list of 2nd level domains ?
    sk

    // sl : http://www.nic.sl
    // Submitted by registry <adam@neoip.com>
    sl
    com.sl
    net.sl
    edu.sl
    gov.sl
    org.sl

    // sm : https://en.wikipedia.org/wiki/.sm
    sm

    // sn : https://en.wikipedia.org/wiki/.sn
    sn
    art.sn
    com.sn
    edu.sn
    gouv.sn
    org.sn
    perso.sn
    univ.sn

    // so : http://sonic.so/policies/
    so
    com.so
    edu.so
    gov.so
    me.so
    net.so
    org.so

    // sr : https://en.wikipedia.org/wiki/.sr
    sr

    // ss : https://registry.nic.ss/
    // Submitted by registry <technical@nic.ss>
    ss
    biz.ss
    com.ss
    edu.ss
    gov.ss
    me.ss
    net.ss
    org.ss
    sch.ss

    // st : http://www.nic.st/html/policyrules/
    st
    co.st
    com.st
    consulado.st
    edu.st
    embaixada.st
    mil.st
    net.st
    org.st
    principe.st
    saotome.st
    store.st

    // su : https://en.wikipedia.org/wiki/.su
    su

    // sv : http://www.svnet.org.sv/niveldos.pdf
    sv
    com.sv
    edu.sv
    gob.sv
    org.sv
    red.sv

    // sx : https://en.wikipedia.org/wiki/.sx
    // Submitted by registry <jcvignes@openregistry.com>
    sx
    gov.sx

    // sy : https://en.wikipedia.org/wiki/.sy
    // see also: http://www.gobin.info/domainname/sy.doc
    sy
    edu.sy
    gov.sy
    net.sy
    mil.sy
    com.sy
    org.sy

    // sz : https://en.wikipedia.org/wiki/.sz
    // http://www.sispa.org.sz/
    sz
    co.sz
    ac.sz
    org.sz

    // tc : https://en.wikipedia.org/wiki/.tc
    tc

    // td : https://en.wikipedia.org/wiki/.td
    td

    // tel: https://en.wikipedia.org/wiki/.tel
    // http://www.telnic.org/
    tel

    // tf : https://en.wikipedia.org/wiki/.tf
    tf

    // tg : https://en.wikipedia.org/wiki/.tg
    // http://www.nic.tg/
    tg

    // th : https://en.wikipedia.org/wiki/.th
    // Submitted by registry <krit@thains.co.th>
    th
    ac.th
    co.th
    go.th
    in.th
    mi.th
    net.th
    or.th

    // tj : http://www.nic.tj/policy.html
    tj
    ac.tj
    biz.tj
    co.tj
    com.tj
    edu.tj
    go.tj
    gov.tj
    int.tj
    mil.tj
    name.tj
    net.tj
    nic.tj
    org.tj
    test.tj
    web.tj

    // tk : https://en.wikipedia.org/wiki/.tk
    tk

    // tl : https://en.wikipedia.org/wiki/.tl
    tl
    gov.tl

    // tm : http://www.nic.tm/local.html
    tm
    com.tm
    co.tm
    org.tm
    net.tm
    nom.tm
    gov.tm
    mil.tm
    edu.tm

    // tn : http://www.registre.tn/fr/
    // https://whois.ati.tn/
    tn
    com.tn
    ens.tn
    fin.tn
    gov.tn
    ind.tn
    info.tn
    intl.tn
    mincom.tn
    nat.tn
    net.tn
    org.tn
    perso.tn
    tourism.tn

    // to : https://en.wikipedia.org/wiki/.to
    // Submitted by registry <egullich@colo.to>
    to
    com.to
    gov.to
    net.to
    org.to
    edu.to
    mil.to

    // tr : https://nic.tr/
    // https://nic.tr/forms/eng/policies.pdf
    // https://nic.tr/index.php?USRACTN=PRICELST
    tr
    av.tr
    bbs.tr
    bel.tr
    biz.tr
    com.tr
    dr.tr
    edu.tr
    gen.tr
    gov.tr
    info.tr
    mil.tr
    k12.tr
    kep.tr
    name.tr
    net.tr
    org.tr
    pol.tr
    tel.tr
    tsk.tr
    tv.tr
    web.tr
    // Used by Northern Cyprus
    nc.tr
    // Used by government agencies of Northern Cyprus
    gov.nc.tr

    // tt : http://www.nic.tt/
    tt
    co.tt
    com.tt
    org.tt
    net.tt
    biz.tt
    info.tt
    pro.tt
    int.tt
    coop.tt
    jobs.tt
    mobi.tt
    travel.tt
    museum.tt
    aero.tt
    name.tt
    gov.tt
    edu.tt

    // tv : https://en.wikipedia.org/wiki/.tv
    // Not listing any 2LDs as reserved since none seem to exist in practice,
    // Wikipedia notwithstanding.
    tv

    // tw : https://en.wikipedia.org/wiki/.tw
    tw
    edu.tw
    gov.tw
    mil.tw
    com.tw
    net.tw
    org.tw
    idv.tw
    game.tw
    ebiz.tw
    club.tw
    網路.tw
    組織.tw
    商業.tw

    // tz : http://www.tznic.or.tz/index.php/domains
    // Submitted by registry <manager@tznic.or.tz>
    tz
    ac.tz
    co.tz
    go.tz
    hotel.tz
    info.tz
    me.tz
    mil.tz
    mobi.tz
    ne.tz
    or.tz
    sc.tz
    tv.tz

    // ua : https://hostmaster.ua/policy/?ua
    // Submitted by registry <dk@cctld.ua>
    ua
    // ua 2LD
    com.ua
    edu.ua
    gov.ua
    in.ua
    net.ua
    org.ua
    // ua geographic names
    // https://hostmaster.ua/2ld/
    cherkassy.ua
    cherkasy.ua
    chernigov.ua
    chernihiv.ua
    chernivtsi.ua
    chernovtsy.ua
    ck.ua
    cn.ua
    cr.ua
    crimea.ua
    cv.ua
    dn.ua
    dnepropetrovsk.ua
    dnipropetrovsk.ua
    donetsk.ua
    dp.ua
    if.ua
    ivano-frankivsk.ua
    kh.ua
    kharkiv.ua
    kharkov.ua
    kherson.ua
    khmelnitskiy.ua
    khmelnytskyi.ua
    kiev.ua
    kirovograd.ua
    km.ua
    kr.ua
    krym.ua
    ks.ua
    kv.ua
    kyiv.ua
    lg.ua
    lt.ua
    lugansk.ua
    lutsk.ua
    lv.ua
    lviv.ua
    mk.ua
    mykolaiv.ua
    nikolaev.ua
    od.ua
    odesa.ua
    odessa.ua
    pl.ua
    poltava.ua
    rivne.ua
    rovno.ua
    rv.ua
    sb.ua
    sebastopol.ua
    sevastopol.ua
    sm.ua
    sumy.ua
    te.ua
    ternopil.ua
    uz.ua
    uzhgorod.ua
    vinnica.ua
    vinnytsia.ua
    vn.ua
    volyn.ua
    yalta.ua
    zaporizhzhe.ua
    zaporizhzhia.ua
    zhitomir.ua
    zhytomyr.ua
    zp.ua
    zt.ua

    // ug : https://www.registry.co.ug/
    ug
    co.ug
    or.ug
    ac.ug
    sc.ug
    go.ug
    ne.ug
    com.ug
    org.ug

    // uk : https://en.wikipedia.org/wiki/.uk
    // Submitted by registry <Michael.Daly@nominet.org.uk>
    uk
    ac.uk
    co.uk
    gov.uk
    ltd.uk
    me.uk
    net.uk
    nhs.uk
    org.uk
    plc.uk
    police.uk
    *.sch.uk

    // us : https://en.wikipedia.org/wiki/.us
    us
    dni.us
    fed.us
    isa.us
    kids.us
    nsn.us
    // us geographic names
    ak.us
    al.us
    ar.us
    as.us
    az.us
    ca.us
    co.us
    ct.us
    dc.us
    de.us
    fl.us
    ga.us
    gu.us
    hi.us
    ia.us
    id.us
    il.us
    in.us
    ks.us
    ky.us
    la.us
    ma.us
    md.us
    me.us
    mi.us
    mn.us
    mo.us
    ms.us
    mt.us
    nc.us
    nd.us
    ne.us
    nh.us
    nj.us
    nm.us
    nv.us
    ny.us
    oh.us
    ok.us
    or.us
    pa.us
    pr.us
    ri.us
    sc.us
    sd.us
    tn.us
    tx.us
    ut.us
    vi.us
    vt.us
    va.us
    wa.us
    wi.us
    wv.us
    wy.us
    // The registrar notes several more specific domains available in each state,
    // such as state.*.us, dst.*.us, etc., but resolution of these is somewhat
    // haphazard; in some states these domains resolve as addresses, while in others
    // only subdomains are available, or even nothing at all. We include the
    // most common ones where it's clear that different sites are different
    // entities.
    k12.ak.us
    k12.al.us
    k12.ar.us
    k12.as.us
    k12.az.us
    k12.ca.us
    k12.co.us
    k12.ct.us
    k12.dc.us
    k12.de.us
    k12.fl.us
    k12.ga.us
    k12.gu.us
    // k12.hi.us  Bug 614565 - Hawaii has a state-wide DOE login
    k12.ia.us
    k12.id.us
    k12.il.us
    k12.in.us
    k12.ks.us
    k12.ky.us
    k12.la.us
    k12.ma.us
    k12.md.us
    k12.me.us
    k12.mi.us
    k12.mn.us
    k12.mo.us
    k12.ms.us
    k12.mt.us
    k12.nc.us
    // k12.nd.us  Bug 1028347 - Removed at request of Travis Rosso <trossow@nd.gov>
    k12.ne.us
    k12.nh.us
    k12.nj.us
    k12.nm.us
    k12.nv.us
    k12.ny.us
    k12.oh.us
    k12.ok.us
    k12.or.us
    k12.pa.us
    k12.pr.us
    // k12.ri.us  Removed at request of Kim Cournoyer <netsupport@staff.ri.net>
    k12.sc.us
    // k12.sd.us  Bug 934131 - Removed at request of James Booze <James.Booze@k12.sd.us>
    k12.tn.us
    k12.tx.us
    k12.ut.us
    k12.vi.us
    k12.vt.us
    k12.va.us
    k12.wa.us
    k12.wi.us
    // k12.wv.us  Bug 947705 - Removed at request of Verne Britton <verne@wvnet.edu>
    k12.wy.us
    cc.ak.us
    cc.al.us
    cc.ar.us
    cc.as.us
    cc.az.us
    cc.ca.us
    cc.co.us
    cc.ct.us
    cc.dc.us
    cc.de.us
    cc.fl.us
    cc.ga.us
    cc.gu.us
    cc.hi.us
    cc.ia.us
    cc.id.us
    cc.il.us
    cc.in.us
    cc.ks.us
    cc.ky.us
    cc.la.us
    cc.ma.us
    cc.md.us
    cc.me.us
    cc.mi.us
    cc.mn.us
    cc.mo.us
    cc.ms.us
    cc.mt.us
    cc.nc.us
    cc.nd.us
    cc.ne.us
    cc.nh.us
    cc.nj.us
    cc.nm.us
    cc.nv.us
    cc.ny.us
    cc.oh.us
    cc.ok.us
    cc.or.us
    cc.pa.us
    cc.pr.us
    cc.ri.us
    cc.sc.us
    cc.sd.us
    cc.tn.us
    cc.tx.us
    cc.ut.us
    cc.vi.us
    cc.vt.us
    cc.va.us
    cc.wa.us
    cc.wi.us
    cc.wv.us
    cc.wy.us
    lib.ak.us
    lib.al.us
    lib.ar.us
    lib.as.us
    lib.az.us
    lib.ca.us
    lib.co.us
    lib.ct.us
    lib.dc.us
    // lib.de.us  Issue #243 - Moved to Private section at request of Ed Moore <Ed.Moore@lib.de.us>
    lib.fl.us
    lib.ga.us
    lib.gu.us
    lib.hi.us
    lib.ia.us
    lib.id.us
    lib.il.us
    lib.in.us
    lib.ks.us
    lib.ky.us
    lib.la.us
    lib.ma.us
    lib.md.us
    lib.me.us
    lib.mi.us
    lib.mn.us
    lib.mo.us
    lib.ms.us
    lib.mt.us
    lib.nc.us
    lib.nd.us
    lib.ne.us
    lib.nh.us
    lib.nj.us
    lib.nm.us
    lib.nv.us
    lib.ny.us
    lib.oh.us
    lib.ok.us
    lib.or.us
    lib.pa.us
    lib.pr.us
    lib.ri.us
    lib.sc.us
    lib.sd.us
    lib.tn.us
    lib.tx.us
    lib.ut.us
    lib.vi.us
    lib.vt.us
    lib.va.us
    lib.wa.us
    lib.wi.us
    // lib.wv.us  Bug 941670 - Removed at request of Larry W Arnold <arnold@wvlc.lib.wv.us>
    lib.wy.us
    // k12.ma.us contains school districts in Massachusetts. The 4LDs are
    //  managed independently except for private (PVT), charter (CHTR) and
    //  parochial (PAROCH) schools.  Those are delegated directly to the
    //  5LD operators.   <k12-ma-hostmaster _ at _ rsuc.gweep.net>
    pvt.k12.ma.us
    chtr.k12.ma.us
    paroch.k12.ma.us
    // Merit Network, Inc. maintains the registry for =~ /(k12|cc|lib).mi.us/ and the following
    //    see also: http://domreg.merit.edu
    //    see also: whois -h whois.domreg.merit.edu help
    ann-arbor.mi.us
    cog.mi.us
    dst.mi.us
    eaton.mi.us
    gen.mi.us
    mus.mi.us
    tec.mi.us
    washtenaw.mi.us

    // uy : http://www.nic.org.uy/
    uy
    com.uy
    edu.uy
    gub.uy
    mil.uy
    net.uy
    org.uy

    // uz : http://www.reg.uz/
    uz
    co.uz
    com.uz
    net.uz
    org.uz

    // va : https://en.wikipedia.org/wiki/.va
    va

    // vc : https://en.wikipedia.org/wiki/.vc
    // Submitted by registry <kshah@ca.afilias.info>
    vc
    com.vc
    net.vc
    org.vc
    gov.vc
    mil.vc
    edu.vc

    // ve : https://registro.nic.ve/
    // Submitted by registry nic@nic.ve and nicve@conatel.gob.ve
    ve
    arts.ve
    bib.ve
    co.ve
    com.ve
    e12.ve
    edu.ve
    firm.ve
    gob.ve
    gov.ve
    info.ve
    int.ve
    mil.ve
    net.ve
    nom.ve
    org.ve
    rar.ve
    rec.ve
    store.ve
    tec.ve
    web.ve

    // vg : https://en.wikipedia.org/wiki/.vg
    vg

    // vi : http://www.nic.vi/newdomainform.htm
    // http://www.nic.vi/Domain_Rules/body_domain_rules.html indicates some other
    // TLDs are "reserved", such as edu.vi and gov.vi, but doesn't actually say they
    // are available for registration (which they do not seem to be).
    vi
    co.vi
    com.vi
    k12.vi
    net.vi
    org.vi

    // vn : https://www.dot.vn/vnnic/vnnic/domainregistration.jsp
    vn
    com.vn
    net.vn
    org.vn
    edu.vn
    gov.vn
    int.vn
    ac.vn
    biz.vn
    info.vn
    name.vn
    pro.vn
    health.vn

    // vu : https://en.wikipedia.org/wiki/.vu
    // http://www.vunic.vu/
    vu
    com.vu
    edu.vu
    net.vu
    org.vu

    // wf : http://www.afnic.fr/medias/documents/AFNIC-naming-policy2012.pdf
    wf

    // ws : https://en.wikipedia.org/wiki/.ws
    // http://samoanic.ws/index.dhtml
    ws
    com.ws
    net.ws
    org.ws
    gov.ws
    edu.ws

    // yt : http://www.afnic.fr/medias/documents/AFNIC-naming-policy2012.pdf
    yt

    // IDN ccTLDs
    // When submitting patches, please maintain a sort by ISO 3166 ccTLD, then
    // U-label, and follow this format:
    // // A-Label ("<Latin renderings>", <language name>[, variant info]) : <ISO 3166 ccTLD>
    // // [sponsoring org]
    // U-Label

    // xn--mgbaam7a8h ("Emerat", Arabic) : AE
    // http://nic.ae/english/arabicdomain/rules.jsp
    امارات

    // xn--y9a3aq ("hye", Armenian) : AM
    // ISOC AM (operated by .am Registry)
    հայ

    // xn--54b7fta0cc ("Bangla", Bangla) : BD
    বাংলা

    // xn--90ae ("bg", Bulgarian) : BG
    бг

    // xn--mgbcpq6gpa1a ("albahrain", Arabic) : BH
    البحرين

    // xn--90ais ("bel", Belarusian/Russian Cyrillic) : BY
    // Operated by .by registry
    бел

    // xn--fiqs8s ("Zhongguo/China", Chinese, Simplified) : CN
    // CNNIC
    // http://cnnic.cn/html/Dir/2005/10/11/3218.htm
    中国

    // xn--fiqz9s ("Zhongguo/China", Chinese, Traditional) : CN
    // CNNIC
    // http://cnnic.cn/html/Dir/2005/10/11/3218.htm
    中國

    // xn--lgbbat1ad8j ("Algeria/Al Jazair", Arabic) : DZ
    الجزائر

    // xn--wgbh1c ("Egypt/Masr", Arabic) : EG
    // http://www.dotmasr.eg/
    مصر

    // xn--e1a4c ("eu", Cyrillic) : EU
    // https://eurid.eu
    ею

    // xn--qxa6a ("eu", Greek) : EU
    // https://eurid.eu
    ευ

    // xn--mgbah1a3hjkrd ("Mauritania", Arabic) : MR
    موريتانيا

    // xn--node ("ge", Georgian Mkhedruli) : GE
    გე

    // xn--qxam ("el", Greek) : GR
    // Hellenic Ministry of Infrastructure, Transport, and Networks
    ελ

    // xn--j6w193g ("Hong Kong", Chinese) : HK
    // https://www.hkirc.hk
    // Submitted by registry <hk.tech@hkirc.hk>
    // https://www.hkirc.hk/content.jsp?id=30#!/34
    香港
    公司.香港
    教育.香港
    政府.香港
    個人.香港
    網絡.香港
    組織.香港

    // xn--2scrj9c ("Bharat", Kannada) : IN
    // India
    ಭಾರತ

    // xn--3hcrj9c ("Bharat", Oriya) : IN
    // India
    ଭାରତ

    // xn--45br5cyl ("Bharatam", Assamese) : IN
    // India
    ভাৰত

    // xn--h2breg3eve ("Bharatam", Sanskrit) : IN
    // India
    भारतम्

    // xn--h2brj9c8c ("Bharot", Santali) : IN
    // India
    भारोत

    // xn--mgbgu82a ("Bharat", Sindhi) : IN
    // India
    ڀارت

    // xn--rvc1e0am3e ("Bharatam", Malayalam) : IN
    // India
    ഭാരതം

    // xn--h2brj9c ("Bharat", Devanagari) : IN
    // India
    भारत

    // xn--mgbbh1a ("Bharat", Kashmiri) : IN
    // India
    بارت

    // xn--mgbbh1a71e ("Bharat", Arabic) : IN
    // India
    بھارت

    // xn--fpcrj9c3d ("Bharat", Telugu) : IN
    // India
    భారత్

    // xn--gecrj9c ("Bharat", Gujarati) : IN
    // India
    ભારત

    // xn--s9brj9c ("Bharat", Gurmukhi) : IN
    // India
    ਭਾਰਤ

    // xn--45brj9c ("Bharat", Bengali) : IN
    // India
    ভারত

    // xn--xkc2dl3a5ee0h ("India", Tamil) : IN
    // India
    இந்தியா

    // xn--mgba3a4f16a ("Iran", Persian) : IR
    ایران

    // xn--mgba3a4fra ("Iran", Arabic) : IR
    ايران

    // xn--mgbtx2b ("Iraq", Arabic) : IQ
    // Communications and Media Commission
    عراق

    // xn--mgbayh7gpa ("al-Ordon", Arabic) : JO
    // National Information Technology Center (NITC)
    // Royal Scientific Society, Al-Jubeiha
    الاردن

    // xn--3e0b707e ("Republic of Korea", Hangul) : KR
    한국

    // xn--80ao21a ("Kaz", Kazakh) : KZ
    қаз

    // xn--q7ce6a ("Lao", Lao) : LA
    ລາວ

    // xn--fzc2c9e2c ("Lanka", Sinhalese-Sinhala) : LK
    // https://nic.lk
    ලංකා

    // xn--xkc2al3hye2a ("Ilangai", Tamil) : LK
    // https://nic.lk
    இலங்கை

    // xn--mgbc0a9azcg ("Morocco/al-Maghrib", Arabic) : MA
    المغرب

    // xn--d1alf ("mkd", Macedonian) : MK
    // MARnet
    мкд

    // xn--l1acc ("mon", Mongolian) : MN
    мон

    // xn--mix891f ("Macao", Chinese, Traditional) : MO
    // MONIC / HNET Asia (Registry Operator for .mo)
    澳門

    // xn--mix082f ("Macao", Chinese, Simplified) : MO
    澳门

    // xn--mgbx4cd0ab ("Malaysia", Malay) : MY
    مليسيا

    // xn--mgb9awbf ("Oman", Arabic) : OM
    عمان

    // xn--mgbai9azgqp6j ("Pakistan", Urdu/Arabic) : PK
    پاکستان

    // xn--mgbai9a5eva00b ("Pakistan", Urdu/Arabic, variant) : PK
    پاكستان

    // xn--ygbi2ammx ("Falasteen", Arabic) : PS
    // The Palestinian National Internet Naming Authority (PNINA)
    // http://www.pnina.ps
    فلسطين

    // xn--90a3ac ("srb", Cyrillic) : RS
    // https://www.rnids.rs/en/domains/national-domains
    срб
    пр.срб
    орг.срб
    обр.срб
    од.срб
    упр.срб
    ак.срб

    // xn--p1ai ("rf", Russian-Cyrillic) : RU
    // https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
    // Submitted by George Georgievsky <gug@cctld.ru>
    рф

    // xn--wgbl6a ("Qatar", Arabic) : QA
    // http://www.ict.gov.qa/
    قطر

    // xn--mgberp4a5d4ar ("AlSaudiah", Arabic) : SA
    // http://www.nic.net.sa/
    السعودية

    // xn--mgberp4a5d4a87g ("AlSaudiah", Arabic, variant)  : SA
    السعودیة

    // xn--mgbqly7c0a67fbc ("AlSaudiah", Arabic, variant) : SA
    السعودیۃ

    // xn--mgbqly7cvafr ("AlSaudiah", Arabic, variant) : SA
    السعوديه

    // xn--mgbpl2fh ("sudan", Arabic) : SD
    // Operated by .sd registry
    سودان

    // xn--yfro4i67o Singapore ("Singapore", Chinese) : SG
    新加坡

    // xn--clchc0ea0b2g2a9gcd ("Singapore", Tamil) : SG
    சிங்கப்பூர்

    // xn--ogbpf8fl ("Syria", Arabic) : SY
    سورية

    // xn--mgbtf8fl ("Syria", Arabic, variant) : SY
    سوريا

    // xn--o3cw4h ("Thai", Thai) : TH
    // http://www.thnic.co.th
    ไทย
    ศึกษา.ไทย
    ธุรกิจ.ไทย
    รัฐบาล.ไทย
    ทหาร.ไทย
    เน็ต.ไทย
    องค์กร.ไทย

    // xn--pgbs0dh ("Tunisia", Arabic) : TN
    // http://nic.tn
    تونس

    // xn--kpry57d ("Taiwan", Chinese, Traditional) : TW
    // http://www.twnic.net/english/dn/dn_07a.htm
    台灣

    // xn--kprw13d ("Taiwan", Chinese, Simplified) : TW
    // http://www.twnic.net/english/dn/dn_07a.htm
    台湾

    // xn--nnx388a ("Taiwan", Chinese, variant) : TW
    臺灣

    // xn--j1amh ("ukr", Cyrillic) : UA
    укр

    // xn--mgb2ddes ("AlYemen", Arabic) : YE
    اليمن

    // xxx : http://icmregistry.com
    xxx

    // ye : http://www.y.net.ye/services/domain_name.htm
    ye
    com.ye
    edu.ye
    gov.ye
    net.ye
    mil.ye
    org.ye

    // za : https://www.zadna.org.za/content/page/domain-information/
    ac.za
    agric.za
    alt.za
    co.za
    edu.za
    gov.za
    grondar.za
    law.za
    mil.za
    net.za
    ngo.za
    nic.za
    nis.za
    nom.za
    org.za
    school.za
    tm.za
    web.za

    // zm : https://zicta.zm/
    // Submitted by registry <info@zicta.zm>
    zm
    ac.zm
    biz.zm
    co.zm
    com.zm
    edu.zm
    gov.zm
    info.zm
    mil.zm
    net.zm
    org.zm
    sch.zm

    // zw : https://www.potraz.gov.zw/
    // Confirmed by registry <bmtengwa@potraz.gov.zw> 2017-01-25
    zw
    ac.zw
    co.zw
    gov.zw
    mil.zw
    org.zw


    // newGTLDs

    // List of new gTLDs imported from https://www.icann.org/resources/registries/gtlds/v2/gtlds.json on 2022-12-07T15:13:11Z
    // This list is auto-generated, don't edit it manually.
    // aaa : 2015-02-26 American Automobile Association, Inc.
    aaa

    // aarp : 2015-05-21 AARP
    aarp

    // abarth : 2015-07-30 Fiat Chrysler Automobiles N.V.
    abarth

    // abb : 2014-10-24 ABB Ltd
    abb

    // abbott : 2014-07-24 Abbott Laboratories, Inc.
    abbott

    // abbvie : 2015-07-30 AbbVie Inc.
    abbvie

    // abc : 2015-07-30 Disney Enterprises, Inc.
    abc

    // able : 2015-06-25 Able Inc.
    able

    // abogado : 2014-04-24 Registry Services, LLC
    abogado

    // abudhabi : 2015-07-30 Abu Dhabi Systems and Information Centre
    abudhabi

    // academy : 2013-11-07 Binky Moon, LLC
    academy

    // accenture : 2014-08-15 Accenture plc
    accenture

    // accountant : 2014-11-20 dot Accountant Limited
    accountant

    // accountants : 2014-03-20 Binky Moon, LLC
    accountants

    // aco : 2015-01-08 ACO Severin Ahlmann GmbH & Co. KG
    aco

    // actor : 2013-12-12 Dog Beach, LLC
    actor

    // ads : 2014-12-04 Charleston Road Registry Inc.
    ads

    // adult : 2014-10-16 ICM Registry AD LLC
    adult

    // aeg : 2015-03-19 Aktiebolaget Electrolux
    aeg

    // aetna : 2015-05-21 Aetna Life Insurance Company
    aetna

    // afl : 2014-10-02 Australian Football League
    afl

    // africa : 2014-03-24 ZA Central Registry NPC trading as Registry.Africa
    africa

    // agakhan : 2015-04-23 Fondation Aga Khan (Aga Khan Foundation)
    agakhan

    // agency : 2013-11-14 Binky Moon, LLC
    agency

    // aig : 2014-12-18 American International Group, Inc.
    aig

    // airbus : 2015-07-30 Airbus S.A.S.
    airbus

    // airforce : 2014-03-06 Dog Beach, LLC
    airforce

    // airtel : 2014-10-24 Bharti Airtel Limited
    airtel

    // akdn : 2015-04-23 Fondation Aga Khan (Aga Khan Foundation)
    akdn

    // alfaromeo : 2015-07-31 Fiat Chrysler Automobiles N.V.
    alfaromeo

    // alibaba : 2015-01-15 Alibaba Group Holding Limited
    alibaba

    // alipay : 2015-01-15 Alibaba Group Holding Limited
    alipay

    // allfinanz : 2014-07-03 Allfinanz Deutsche Vermögensberatung Aktiengesellschaft
    allfinanz

    // allstate : 2015-07-31 Allstate Fire and Casualty Insurance Company
    allstate

    // ally : 2015-06-18 Ally Financial Inc.
    ally

    // alsace : 2014-07-02 Region Grand Est
    alsace

    // alstom : 2015-07-30 ALSTOM
    alstom

    // amazon : 2019-12-19 Amazon Registry Services, Inc.
    amazon

    // americanexpress : 2015-07-31 American Express Travel Related Services Company, Inc.
    americanexpress

    // americanfamily : 2015-07-23 AmFam, Inc.
    americanfamily

    // amex : 2015-07-31 American Express Travel Related Services Company, Inc.
    amex

    // amfam : 2015-07-23 AmFam, Inc.
    amfam

    // amica : 2015-05-28 Amica Mutual Insurance Company
    amica

    // amsterdam : 2014-07-24 Gemeente Amsterdam
    amsterdam

    // analytics : 2014-12-18 Campus IP LLC
    analytics

    // android : 2014-08-07 Charleston Road Registry Inc.
    android

    // anquan : 2015-01-08 Beijing Qihu Keji Co., Ltd.
    anquan

    // anz : 2015-07-31 Australia and New Zealand Banking Group Limited
    anz

    // aol : 2015-09-17 Oath Inc.
    aol

    // apartments : 2014-12-11 Binky Moon, LLC
    apartments

    // app : 2015-05-14 Charleston Road Registry Inc.
    app

    // apple : 2015-05-14 Apple Inc.
    apple

    // aquarelle : 2014-07-24 Aquarelle.com
    aquarelle

    // arab : 2015-11-12 League of Arab States
    arab

    // aramco : 2014-11-20 Aramco Services Company
    aramco

    // archi : 2014-02-06 Identity Digital Limited
    archi

    // army : 2014-03-06 Dog Beach, LLC
    army

    // art : 2016-03-24 UK Creative Ideas Limited
    art

    // arte : 2014-12-11 Association Relative à la Télévision Européenne G.E.I.E.
    arte

    // asda : 2015-07-31 Wal-Mart Stores, Inc.
    asda

    // associates : 2014-03-06 Binky Moon, LLC
    associates

    // athleta : 2015-07-30 The Gap, Inc.
    athleta

    // attorney : 2014-03-20 Dog Beach, LLC
    attorney

    // auction : 2014-03-20 Dog Beach, LLC
    auction

    // audi : 2015-05-21 AUDI Aktiengesellschaft
    audi

    // audible : 2015-06-25 Amazon Registry Services, Inc.
    audible

    // audio : 2014-03-20 XYZ.COM LLC
    audio

    // auspost : 2015-08-13 Australian Postal Corporation
    auspost

    // author : 2014-12-18 Amazon Registry Services, Inc.
    author

    // auto : 2014-11-13 XYZ.COM LLC
    auto

    // autos : 2014-01-09 XYZ.COM LLC
    autos

    // avianca : 2015-01-08 Avianca Inc.
    avianca

    // aws : 2015-06-25 AWS Registry LLC
    aws

    // axa : 2013-12-19 AXA Group Operations SAS
    axa

    // azure : 2014-12-18 Microsoft Corporation
    azure

    // baby : 2015-04-09 XYZ.COM LLC
    baby

    // baidu : 2015-01-08 Baidu, Inc.
    baidu

    // banamex : 2015-07-30 Citigroup Inc.
    banamex

    // bananarepublic : 2015-07-31 The Gap, Inc.
    bananarepublic

    // band : 2014-06-12 Dog Beach, LLC
    band

    // bank : 2014-09-25 fTLD Registry Services LLC
    bank

    // bar : 2013-12-12 Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
    bar

    // barcelona : 2014-07-24 Municipi de Barcelona
    barcelona

    // barclaycard : 2014-11-20 Barclays Bank PLC
    barclaycard

    // barclays : 2014-11-20 Barclays Bank PLC
    barclays

    // barefoot : 2015-06-11 Gallo Vineyards, Inc.
    barefoot

    // bargains : 2013-11-14 Binky Moon, LLC
    bargains

    // baseball : 2015-10-29 MLB Advanced Media DH, LLC
    baseball

    // basketball : 2015-08-20 Fédération Internationale de Basketball (FIBA)
    basketball

    // bauhaus : 2014-04-17 Werkhaus GmbH
    bauhaus

    // bayern : 2014-01-23 Bayern Connect GmbH
    bayern

    // bbc : 2014-12-18 British Broadcasting Corporation
    bbc

    // bbt : 2015-07-23 BB&T Corporation
    bbt

    // bbva : 2014-10-02 BANCO BILBAO VIZCAYA ARGENTARIA, S.A.
    bbva

    // bcg : 2015-04-02 The Boston Consulting Group, Inc.
    bcg

    // bcn : 2014-07-24 Municipi de Barcelona
    bcn

    // beats : 2015-05-14 Beats Electronics, LLC
    beats

    // beauty : 2015-12-03 XYZ.COM LLC
    beauty

    // beer : 2014-01-09 Registry Services, LLC
    beer

    // bentley : 2014-12-18 Bentley Motors Limited
    bentley

    // berlin : 2013-10-31 dotBERLIN GmbH & Co. KG
    berlin

    // best : 2013-12-19 BestTLD Pty Ltd
    best

    // bestbuy : 2015-07-31 BBY Solutions, Inc.
    bestbuy

    // bet : 2015-05-07 Identity Digital Limited
    bet

    // bharti : 2014-01-09 Bharti Enterprises (Holding) Private Limited
    bharti

    // bible : 2014-06-19 American Bible Society
    bible

    // bid : 2013-12-19 dot Bid Limited
    bid

    // bike : 2013-08-27 Binky Moon, LLC
    bike

    // bing : 2014-12-18 Microsoft Corporation
    bing

    // bingo : 2014-12-04 Binky Moon, LLC
    bingo

    // bio : 2014-03-06 Identity Digital Limited
    bio

    // black : 2014-01-16 Identity Digital Limited
    black

    // blackfriday : 2014-01-16 Registry Services, LLC
    blackfriday

    // blockbuster : 2015-07-30 Dish DBS Corporation
    blockbuster

    // blog : 2015-05-14 Knock Knock WHOIS There, LLC
    blog

    // bloomberg : 2014-07-17 Bloomberg IP Holdings LLC
    bloomberg

    // blue : 2013-11-07 Identity Digital Limited
    blue

    // bms : 2014-10-30 Bristol-Myers Squibb Company
    bms

    // bmw : 2014-01-09 Bayerische Motoren Werke Aktiengesellschaft
    bmw

    // bnpparibas : 2014-05-29 BNP Paribas
    bnpparibas

    // boats : 2014-12-04 XYZ.COM LLC
    boats

    // boehringer : 2015-07-09 Boehringer Ingelheim International GmbH
    boehringer

    // bofa : 2015-07-31 Bank of America Corporation
    bofa

    // bom : 2014-10-16 Núcleo de Informação e Coordenação do Ponto BR - NIC.br
    bom

    // bond : 2014-06-05 ShortDot SA
    bond

    // boo : 2014-01-30 Charleston Road Registry Inc.
    boo

    // book : 2015-08-27 Amazon Registry Services, Inc.
    book

    // booking : 2015-07-16 Booking.com B.V.
    booking

    // bosch : 2015-06-18 Robert Bosch GMBH
    bosch

    // bostik : 2015-05-28 Bostik SA
    bostik

    // boston : 2015-12-10 Registry Services, LLC
    boston

    // bot : 2014-12-18 Amazon Registry Services, Inc.
    bot

    // boutique : 2013-11-14 Binky Moon, LLC
    boutique

    // box : 2015-11-12 Intercap Registry Inc.
    box

    // bradesco : 2014-12-18 Banco Bradesco S.A.
    bradesco

    // bridgestone : 2014-12-18 Bridgestone Corporation
    bridgestone

    // broadway : 2014-12-22 Celebrate Broadway, Inc.
    broadway

    // broker : 2014-12-11 Dog Beach, LLC
    broker

    // brother : 2015-01-29 Brother Industries, Ltd.
    brother

    // brussels : 2014-02-06 DNS.be vzw
    brussels

    // build : 2013-11-07 Plan Bee LLC
    build

    // builders : 2013-11-07 Binky Moon, LLC
    builders

    // business : 2013-11-07 Binky Moon, LLC
    business

    // buy : 2014-12-18 Amazon Registry Services, Inc.
    buy

    // buzz : 2013-10-02 DOTSTRATEGY CO.
    buzz

    // bzh : 2014-02-27 Association www.bzh
    bzh

    // cab : 2013-10-24 Binky Moon, LLC
    cab

    // cafe : 2015-02-11 Binky Moon, LLC
    cafe

    // cal : 2014-07-24 Charleston Road Registry Inc.
    cal

    // call : 2014-12-18 Amazon Registry Services, Inc.
    call

    // calvinklein : 2015-07-30 PVH gTLD Holdings LLC
    calvinklein

    // cam : 2016-04-21 Cam Connecting SARL
    cam

    // camera : 2013-08-27 Binky Moon, LLC
    camera

    // camp : 2013-11-07 Binky Moon, LLC
    camp

    // canon : 2014-09-12 Canon Inc.
    canon

    // capetown : 2014-03-24 ZA Central Registry NPC trading as ZA Central Registry
    capetown

    // capital : 2014-03-06 Binky Moon, LLC
    capital

    // capitalone : 2015-08-06 Capital One Financial Corporation
    capitalone

    // car : 2015-01-22 XYZ.COM LLC
    car

    // caravan : 2013-12-12 Caravan International, Inc.
    caravan

    // cards : 2013-12-05 Binky Moon, LLC
    cards

    // care : 2014-03-06 Binky Moon, LLC
    care

    // career : 2013-10-09 dotCareer LLC
    career

    // careers : 2013-10-02 Binky Moon, LLC
    careers

    // cars : 2014-11-13 XYZ.COM LLC
    cars

    // casa : 2013-11-21 Registry Services, LLC
    casa

    // case : 2015-09-03 Digity, LLC
    case

    // cash : 2014-03-06 Binky Moon, LLC
    cash

    // casino : 2014-12-18 Binky Moon, LLC
    casino

    // catering : 2013-12-05 Binky Moon, LLC
    catering

    // catholic : 2015-10-21 Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
    catholic

    // cba : 2014-06-26 COMMONWEALTH BANK OF AUSTRALIA
    cba

    // cbn : 2014-08-22 The Christian Broadcasting Network, Inc.
    cbn

    // cbre : 2015-07-02 CBRE, Inc.
    cbre

    // cbs : 2015-08-06 CBS Domains Inc.
    cbs

    // center : 2013-11-07 Binky Moon, LLC
    center

    // ceo : 2013-11-07 CEOTLD Pty Ltd
    ceo

    // cern : 2014-06-05 European Organization for Nuclear Research ("CERN")
    cern

    // cfa : 2014-08-28 CFA Institute
    cfa

    // cfd : 2014-12-11 ShortDot SA
    cfd

    // chanel : 2015-04-09 Chanel International B.V.
    chanel

    // channel : 2014-05-08 Charleston Road Registry Inc.
    channel

    // charity : 2018-04-11 Public Interest Registry
    charity

    // chase : 2015-04-30 JPMorgan Chase Bank, National Association
    chase

    // chat : 2014-12-04 Binky Moon, LLC
    chat

    // cheap : 2013-11-14 Binky Moon, LLC
    cheap

    // chintai : 2015-06-11 CHINTAI Corporation
    chintai

    // christmas : 2013-11-21 XYZ.COM LLC
    christmas

    // chrome : 2014-07-24 Charleston Road Registry Inc.
    chrome

    // church : 2014-02-06 Binky Moon, LLC
    church

    // cipriani : 2015-02-19 Hotel Cipriani Srl
    cipriani

    // circle : 2014-12-18 Amazon Registry Services, Inc.
    circle

    // cisco : 2014-12-22 Cisco Technology, Inc.
    cisco

    // citadel : 2015-07-23 Citadel Domain LLC
    citadel

    // citi : 2015-07-30 Citigroup Inc.
    citi

    // citic : 2014-01-09 CITIC Group Corporation
    citic

    // city : 2014-05-29 Binky Moon, LLC
    city

    // cityeats : 2014-12-11 Lifestyle Domain Holdings, Inc.
    cityeats

    // claims : 2014-03-20 Binky Moon, LLC
    claims

    // cleaning : 2013-12-05 Binky Moon, LLC
    cleaning

    // click : 2014-06-05 Internet Naming Company LLC
    click

    // clinic : 2014-03-20 Binky Moon, LLC
    clinic

    // clinique : 2015-10-01 The Estée Lauder Companies Inc.
    clinique

    // clothing : 2013-08-27 Binky Moon, LLC
    clothing

    // cloud : 2015-04-16 Aruba PEC S.p.A.
    cloud

    // club : 2013-11-08 Registry Services, LLC
    club

    // clubmed : 2015-06-25 Club Méditerranée S.A.
    clubmed

    // coach : 2014-10-09 Binky Moon, LLC
    coach

    // codes : 2013-10-31 Binky Moon, LLC
    codes

    // coffee : 2013-10-17 Binky Moon, LLC
    coffee

    // college : 2014-01-16 XYZ.COM LLC
    college

    // cologne : 2014-02-05 dotKoeln GmbH
    cologne

    // comcast : 2015-07-23 Comcast IP Holdings I, LLC
    comcast

    // commbank : 2014-06-26 COMMONWEALTH BANK OF AUSTRALIA
    commbank

    // community : 2013-12-05 Binky Moon, LLC
    community

    // company : 2013-11-07 Binky Moon, LLC
    company

    // compare : 2015-10-08 Registry Services, LLC
    compare

    // computer : 2013-10-24 Binky Moon, LLC
    computer

    // comsec : 2015-01-08 VeriSign, Inc.
    comsec

    // condos : 2013-12-05 Binky Moon, LLC
    condos

    // construction : 2013-09-16 Binky Moon, LLC
    construction

    // consulting : 2013-12-05 Dog Beach, LLC
    consulting

    // contact : 2015-01-08 Dog Beach, LLC
    contact

    // contractors : 2013-09-10 Binky Moon, LLC
    contractors

    // cooking : 2013-11-21 Registry Services, LLC
    cooking

    // cookingchannel : 2015-07-02 Lifestyle Domain Holdings, Inc.
    cookingchannel

    // cool : 2013-11-14 Binky Moon, LLC
    cool

    // corsica : 2014-09-25 Collectivité de Corse
    corsica

    // country : 2013-12-19 Internet Naming Company LLC
    country

    // coupon : 2015-02-26 Amazon Registry Services, Inc.
    coupon

    // coupons : 2015-03-26 Binky Moon, LLC
    coupons

    // courses : 2014-12-04 Registry Services, LLC
    courses

    // cpa : 2019-06-10 American Institute of Certified Public Accountants
    cpa

    // credit : 2014-03-20 Binky Moon, LLC
    credit

    // creditcard : 2014-03-20 Binky Moon, LLC
    creditcard

    // creditunion : 2015-01-22 DotCooperation LLC
    creditunion

    // cricket : 2014-10-09 dot Cricket Limited
    cricket

    // crown : 2014-10-24 Crown Equipment Corporation
    crown

    // crs : 2014-04-03 Federated Co-operatives Limited
    crs

    // cruise : 2015-12-10 Viking River Cruises (Bermuda) Ltd.
    cruise

    // cruises : 2013-12-05 Binky Moon, LLC
    cruises

    // cuisinella : 2014-04-03 SCHMIDT GROUPE S.A.S.
    cuisinella

    // cymru : 2014-05-08 Nominet UK
    cymru

    // cyou : 2015-01-22 ShortDot SA
    cyou

    // dabur : 2014-02-06 Dabur India Limited
    dabur

    // dad : 2014-01-23 Charleston Road Registry Inc.
    dad

    // dance : 2013-10-24 Dog Beach, LLC
    dance

    // data : 2016-06-02 Dish DBS Corporation
    data

    // date : 2014-11-20 dot Date Limited
    date

    // dating : 2013-12-05 Binky Moon, LLC
    dating

    // datsun : 2014-03-27 NISSAN MOTOR CO., LTD.
    datsun

    // day : 2014-01-30 Charleston Road Registry Inc.
    day

    // dclk : 2014-11-20 Charleston Road Registry Inc.
    dclk

    // dds : 2015-05-07 Registry Services, LLC
    dds

    // deal : 2015-06-25 Amazon Registry Services, Inc.
    deal

    // dealer : 2014-12-22 Intercap Registry Inc.
    dealer

    // deals : 2014-05-22 Binky Moon, LLC
    deals

    // degree : 2014-03-06 Dog Beach, LLC
    degree

    // delivery : 2014-09-11 Binky Moon, LLC
    delivery

    // dell : 2014-10-24 Dell Inc.
    dell

    // deloitte : 2015-07-31 Deloitte Touche Tohmatsu
    deloitte

    // delta : 2015-02-19 Delta Air Lines, Inc.
    delta

    // democrat : 2013-10-24 Dog Beach, LLC
    democrat

    // dental : 2014-03-20 Binky Moon, LLC
    dental

    // dentist : 2014-03-20 Dog Beach, LLC
    dentist

    // desi : 2013-11-14 Desi Networks LLC
    desi

    // design : 2014-11-07 Registry Services, LLC
    design

    // dev : 2014-10-16 Charleston Road Registry Inc.
    dev

    // dhl : 2015-07-23 Deutsche Post AG
    dhl

    // diamonds : 2013-09-22 Binky Moon, LLC
    diamonds

    // diet : 2014-06-26 XYZ.COM LLC
    diet

    // digital : 2014-03-06 Binky Moon, LLC
    digital

    // direct : 2014-04-10 Binky Moon, LLC
    direct

    // directory : 2013-09-20 Binky Moon, LLC
    directory

    // discount : 2014-03-06 Binky Moon, LLC
    discount

    // discover : 2015-07-23 Discover Financial Services
    discover

    // dish : 2015-07-30 Dish DBS Corporation
    dish

    // diy : 2015-11-05 Lifestyle Domain Holdings, Inc.
    diy

    // dnp : 2013-12-13 Dai Nippon Printing Co., Ltd.
    dnp

    // docs : 2014-10-16 Charleston Road Registry Inc.
    docs

    // doctor : 2016-06-02 Binky Moon, LLC
    doctor

    // dog : 2014-12-04 Binky Moon, LLC
    dog

    // domains : 2013-10-17 Binky Moon, LLC
    domains

    // dot : 2015-05-21 Dish DBS Corporation
    dot

    // download : 2014-11-20 dot Support Limited
    download

    // drive : 2015-03-05 Charleston Road Registry Inc.
    drive

    // dtv : 2015-06-04 Dish DBS Corporation
    dtv

    // dubai : 2015-01-01 Dubai Smart Government Department
    dubai

    // dunlop : 2015-07-02 The Goodyear Tire & Rubber Company
    dunlop

    // dupont : 2015-06-25 DuPont Specialty Products USA, LLC
    dupont

    // durban : 2014-03-24 ZA Central Registry NPC trading as ZA Central Registry
    durban

    // dvag : 2014-06-23 Deutsche Vermögensberatung Aktiengesellschaft DVAG
    dvag

    // dvr : 2016-05-26 DISH Technologies L.L.C.
    dvr

    // earth : 2014-12-04 Interlink Systems Innovation Institute K.K.
    earth

    // eat : 2014-01-23 Charleston Road Registry Inc.
    eat

    // eco : 2016-07-08 Big Room Inc.
    eco

    // edeka : 2014-12-18 EDEKA Verband kaufmännischer Genossenschaften e.V.
    edeka

    // education : 2013-11-07 Binky Moon, LLC
    education

    // email : 2013-10-31 Binky Moon, LLC
    email

    // emerck : 2014-04-03 Merck KGaA
    emerck

    // energy : 2014-09-11 Binky Moon, LLC
    energy

    // engineer : 2014-03-06 Dog Beach, LLC
    engineer

    // engineering : 2014-03-06 Binky Moon, LLC
    engineering

    // enterprises : 2013-09-20 Binky Moon, LLC
    enterprises

    // epson : 2014-12-04 Seiko Epson Corporation
    epson

    // equipment : 2013-08-27 Binky Moon, LLC
    equipment

    // ericsson : 2015-07-09 Telefonaktiebolaget L M Ericsson
    ericsson

    // erni : 2014-04-03 ERNI Group Holding AG
    erni

    // esq : 2014-05-08 Charleston Road Registry Inc.
    esq

    // estate : 2013-08-27 Binky Moon, LLC
    estate

    // etisalat : 2015-09-03 Emirates Telecommunications Corporation (trading as Etisalat)
    etisalat

    // eurovision : 2014-04-24 European Broadcasting Union (EBU)
    eurovision

    // eus : 2013-12-12 Puntueus Fundazioa
    eus

    // events : 2013-12-05 Binky Moon, LLC
    events

    // exchange : 2014-03-06 Binky Moon, LLC
    exchange

    // expert : 2013-11-21 Binky Moon, LLC
    expert

    // exposed : 2013-12-05 Binky Moon, LLC
    exposed

    // express : 2015-02-11 Binky Moon, LLC
    express

    // extraspace : 2015-05-14 Extra Space Storage LLC
    extraspace

    // fage : 2014-12-18 Fage International S.A.
    fage

    // fail : 2014-03-06 Binky Moon, LLC
    fail

    // fairwinds : 2014-11-13 FairWinds Partners, LLC
    fairwinds

    // faith : 2014-11-20 dot Faith Limited
    faith

    // family : 2015-04-02 Dog Beach, LLC
    family

    // fan : 2014-03-06 Dog Beach, LLC
    fan

    // fans : 2014-11-07 ZDNS International Limited
    fans

    // farm : 2013-11-07 Binky Moon, LLC
    farm

    // farmers : 2015-07-09 Farmers Insurance Exchange
    farmers

    // fashion : 2014-07-03 Registry Services, LLC
    fashion

    // fast : 2014-12-18 Amazon Registry Services, Inc.
    fast

    // fedex : 2015-08-06 Federal Express Corporation
    fedex

    // feedback : 2013-12-19 Top Level Spectrum, Inc.
    feedback

    // ferrari : 2015-07-31 Fiat Chrysler Automobiles N.V.
    ferrari

    // ferrero : 2014-12-18 Ferrero Trading Lux S.A.
    ferrero

    // fiat : 2015-07-31 Fiat Chrysler Automobiles N.V.
    fiat

    // fidelity : 2015-07-30 Fidelity Brokerage Services LLC
    fidelity

    // fido : 2015-08-06 Rogers Communications Canada Inc.
    fido

    // film : 2015-01-08 Motion Picture Domain Registry Pty Ltd
    film

    // final : 2014-10-16 Núcleo de Informação e Coordenação do Ponto BR - NIC.br
    final

    // finance : 2014-03-20 Binky Moon, LLC
    finance

    // financial : 2014-03-06 Binky Moon, LLC
    financial

    // fire : 2015-06-25 Amazon Registry Services, Inc.
    fire

    // firestone : 2014-12-18 Bridgestone Licensing Services, Inc
    firestone

    // firmdale : 2014-03-27 Firmdale Holdings Limited
    firmdale

    // fish : 2013-12-12 Binky Moon, LLC
    fish

    // fishing : 2013-11-21 Registry Services, LLC
    fishing

    // fit : 2014-11-07 Registry Services, LLC
    fit

    // fitness : 2014-03-06 Binky Moon, LLC
    fitness

    // flickr : 2015-04-02 Flickr, Inc.
    flickr

    // flights : 2013-12-05 Binky Moon, LLC
    flights

    // flir : 2015-07-23 FLIR Systems, Inc.
    flir

    // florist : 2013-11-07 Binky Moon, LLC
    florist

    // flowers : 2014-10-09 XYZ.COM LLC
    flowers

    // fly : 2014-05-08 Charleston Road Registry Inc.
    fly

    // foo : 2014-01-23 Charleston Road Registry Inc.
    foo

    // food : 2016-04-21 Lifestyle Domain Holdings, Inc.
    food

    // foodnetwork : 2015-07-02 Lifestyle Domain Holdings, Inc.
    foodnetwork

    // football : 2014-12-18 Binky Moon, LLC
    football

    // ford : 2014-11-13 Ford Motor Company
    ford

    // forex : 2014-12-11 Dog Beach, LLC
    forex

    // forsale : 2014-05-22 Dog Beach, LLC
    forsale

    // forum : 2015-04-02 Fegistry, LLC
    forum

    // foundation : 2013-12-05 Public Interest Registry
    foundation

    // fox : 2015-09-11 FOX Registry, LLC
    fox

    // free : 2015-12-10 Amazon Registry Services, Inc.
    free

    // fresenius : 2015-07-30 Fresenius Immobilien-Verwaltungs-GmbH
    fresenius

    // frl : 2014-05-15 FRLregistry B.V.
    frl

    // frogans : 2013-12-19 OP3FT
    frogans

    // frontdoor : 2015-07-02 Lifestyle Domain Holdings, Inc.
    frontdoor

    // frontier : 2015-02-05 Frontier Communications Corporation
    frontier

    // ftr : 2015-07-16 Frontier Communications Corporation
    ftr

    // fujitsu : 2015-07-30 Fujitsu Limited
    fujitsu

    // fun : 2016-01-14 Radix FZC
    fun

    // fund : 2014-03-20 Binky Moon, LLC
    fund

    // furniture : 2014-03-20 Binky Moon, LLC
    furniture

    // futbol : 2013-09-20 Dog Beach, LLC
    futbol

    // fyi : 2015-04-02 Binky Moon, LLC
    fyi

    // gal : 2013-11-07 Asociación puntoGAL
    gal

    // gallery : 2013-09-13 Binky Moon, LLC
    gallery

    // gallo : 2015-06-11 Gallo Vineyards, Inc.
    gallo

    // gallup : 2015-02-19 Gallup, Inc.
    gallup

    // game : 2015-05-28 XYZ.COM LLC
    game

    // games : 2015-05-28 Dog Beach, LLC
    games

    // gap : 2015-07-31 The Gap, Inc.
    gap

    // garden : 2014-06-26 Registry Services, LLC
    garden

    // gay : 2019-05-23 Top Level Design, LLC
    gay

    // gbiz : 2014-07-17 Charleston Road Registry Inc.
    gbiz

    // gdn : 2014-07-31 Joint Stock Company "Navigation-information systems"
    gdn

    // gea : 2014-12-04 GEA Group Aktiengesellschaft
    gea

    // gent : 2014-01-23 Easyhost BV
    gent

    // genting : 2015-03-12 Resorts World Inc Pte. Ltd.
    genting

    // george : 2015-07-31 Wal-Mart Stores, Inc.
    george

    // ggee : 2014-01-09 GMO Internet, Inc.
    ggee

    // gift : 2013-10-17 DotGift, LLC
    gift

    // gifts : 2014-07-03 Binky Moon, LLC
    gifts

    // gives : 2014-03-06 Public Interest Registry
    gives

    // giving : 2014-11-13 Public Interest Registry
    giving

    // glass : 2013-11-07 Binky Moon, LLC
    glass

    // gle : 2014-07-24 Charleston Road Registry Inc.
    gle

    // global : 2014-04-17 Dot Global Domain Registry Limited
    global

    // globo : 2013-12-19 Globo Comunicação e Participações S.A
    globo

    // gmail : 2014-05-01 Charleston Road Registry Inc.
    gmail

    // gmbh : 2016-01-29 Binky Moon, LLC
    gmbh

    // gmo : 2014-01-09 GMO Internet, Inc.
    gmo

    // gmx : 2014-04-24 1&1 Mail & Media GmbH
    gmx

    // godaddy : 2015-07-23 Go Daddy East, LLC
    godaddy

    // gold : 2015-01-22 Binky Moon, LLC
    gold

    // goldpoint : 2014-11-20 YODOBASHI CAMERA CO.,LTD.
    goldpoint

    // golf : 2014-12-18 Binky Moon, LLC
    golf

    // goo : 2014-12-18 NTT Resonant Inc.
    goo

    // goodyear : 2015-07-02 The Goodyear Tire & Rubber Company
    goodyear

    // goog : 2014-11-20 Charleston Road Registry Inc.
    goog

    // google : 2014-07-24 Charleston Road Registry Inc.
    google

    // gop : 2014-01-16 Republican State Leadership Committee, Inc.
    gop

    // got : 2014-12-18 Amazon Registry Services, Inc.
    got

    // grainger : 2015-05-07 Grainger Registry Services, LLC
    grainger

    // graphics : 2013-09-13 Binky Moon, LLC
    graphics

    // gratis : 2014-03-20 Binky Moon, LLC
    gratis

    // green : 2014-05-08 Identity Digital Limited
    green

    // gripe : 2014-03-06 Binky Moon, LLC
    gripe

    // grocery : 2016-06-16 Wal-Mart Stores, Inc.
    grocery

    // group : 2014-08-15 Binky Moon, LLC
    group

    // guardian : 2015-07-30 The Guardian Life Insurance Company of America
    guardian

    // gucci : 2014-11-13 Guccio Gucci S.p.a.
    gucci

    // guge : 2014-08-28 Charleston Road Registry Inc.
    guge

    // guide : 2013-09-13 Binky Moon, LLC
    guide

    // guitars : 2013-11-14 XYZ.COM LLC
    guitars

    // guru : 2013-08-27 Binky Moon, LLC
    guru

    // hair : 2015-12-03 XYZ.COM LLC
    hair

    // hamburg : 2014-02-20 Hamburg Top-Level-Domain GmbH
    hamburg

    // hangout : 2014-11-13 Charleston Road Registry Inc.
    hangout

    // haus : 2013-12-05 Dog Beach, LLC
    haus

    // hbo : 2015-07-30 HBO Registry Services, Inc.
    hbo

    // hdfc : 2015-07-30 HOUSING DEVELOPMENT FINANCE CORPORATION LIMITED
    hdfc

    // hdfcbank : 2015-02-12 HDFC Bank Limited
    hdfcbank

    // health : 2015-02-11 DotHealth, LLC
    health

    // healthcare : 2014-06-12 Binky Moon, LLC
    healthcare

    // help : 2014-06-26 Innovation service Limited
    help

    // helsinki : 2015-02-05 City of Helsinki
    helsinki

    // here : 2014-02-06 Charleston Road Registry Inc.
    here

    // hermes : 2014-07-10 HERMES INTERNATIONAL
    hermes

    // hgtv : 2015-07-02 Lifestyle Domain Holdings, Inc.
    hgtv

    // hiphop : 2014-03-06 Dot Hip Hop, LLC
    hiphop

    // hisamitsu : 2015-07-16 Hisamitsu Pharmaceutical Co.,Inc.
    hisamitsu

    // hitachi : 2014-10-31 Hitachi, Ltd.
    hitachi

    // hiv : 2014-03-13 Internet Naming Company LLC
    hiv

    // hkt : 2015-05-14 PCCW-HKT DataCom Services Limited
    hkt

    // hockey : 2015-03-19 Binky Moon, LLC
    hockey

    // holdings : 2013-08-27 Binky Moon, LLC
    holdings

    // holiday : 2013-11-07 Binky Moon, LLC
    holiday

    // homedepot : 2015-04-02 Home Depot Product Authority, LLC
    homedepot

    // homegoods : 2015-07-16 The TJX Companies, Inc.
    homegoods

    // homes : 2014-01-09 XYZ.COM LLC
    homes

    // homesense : 2015-07-16 The TJX Companies, Inc.
    homesense

    // honda : 2014-12-18 Honda Motor Co., Ltd.
    honda

    // horse : 2013-11-21 Registry Services, LLC
    horse

    // hospital : 2016-10-20 Binky Moon, LLC
    hospital

    // host : 2014-04-17 Radix FZC
    host

    // hosting : 2014-05-29 XYZ.COM LLC
    hosting

    // hot : 2015-08-27 Amazon Registry Services, Inc.
    hot

    // hoteles : 2015-03-05 Travel Reservations SRL
    hoteles

    // hotels : 2016-04-07 Booking.com B.V.
    hotels

    // hotmail : 2014-12-18 Microsoft Corporation
    hotmail

    // house : 2013-11-07 Binky Moon, LLC
    house

    // how : 2014-01-23 Charleston Road Registry Inc.
    how

    // hsbc : 2014-10-24 HSBC Global Services (UK) Limited
    hsbc

    // hughes : 2015-07-30 Hughes Satellite Systems Corporation
    hughes

    // hyatt : 2015-07-30 Hyatt GTLD, L.L.C.
    hyatt

    // hyundai : 2015-07-09 Hyundai Motor Company
    hyundai

    // ibm : 2014-07-31 International Business Machines Corporation
    ibm

    // icbc : 2015-02-19 Industrial and Commercial Bank of China Limited
    icbc

    // ice : 2014-10-30 IntercontinentalExchange, Inc.
    ice

    // icu : 2015-01-08 ShortDot SA
    icu

    // ieee : 2015-07-23 IEEE Global LLC
    ieee

    // ifm : 2014-01-30 ifm electronic gmbh
    ifm

    // ikano : 2015-07-09 Ikano S.A.
    ikano

    // imamat : 2015-08-06 Fondation Aga Khan (Aga Khan Foundation)
    imamat

    // imdb : 2015-06-25 Amazon Registry Services, Inc.
    imdb

    // immo : 2014-07-10 Binky Moon, LLC
    immo

    // immobilien : 2013-11-07 Dog Beach, LLC
    immobilien

    // inc : 2018-03-10 Intercap Registry Inc.
    inc

    // industries : 2013-12-05 Binky Moon, LLC
    industries

    // infiniti : 2014-03-27 NISSAN MOTOR CO., LTD.
    infiniti

    // ing : 2014-01-23 Charleston Road Registry Inc.
    ing

    // ink : 2013-12-05 Top Level Design, LLC
    ink

    // institute : 2013-11-07 Binky Moon, LLC
    institute

    // insurance : 2015-02-19 fTLD Registry Services LLC
    insurance

    // insure : 2014-03-20 Binky Moon, LLC
    insure

    // international : 2013-11-07 Binky Moon, LLC
    international

    // intuit : 2015-07-30 Intuit Administrative Services, Inc.
    intuit

    // investments : 2014-03-20 Binky Moon, LLC
    investments

    // ipiranga : 2014-08-28 Ipiranga Produtos de Petroleo S.A.
    ipiranga

    // irish : 2014-08-07 Binky Moon, LLC
    irish

    // ismaili : 2015-08-06 Fondation Aga Khan (Aga Khan Foundation)
    ismaili

    // ist : 2014-08-28 Istanbul Metropolitan Municipality
    ist

    // istanbul : 2014-08-28 Istanbul Metropolitan Municipality
    istanbul

    // itau : 2014-10-02 Itau Unibanco Holding S.A.
    itau

    // itv : 2015-07-09 ITV Services Limited
    itv

    // jaguar : 2014-11-13 Jaguar Land Rover Ltd
    jaguar

    // java : 2014-06-19 Oracle Corporation
    java

    // jcb : 2014-11-20 JCB Co., Ltd.
    jcb

    // jeep : 2015-07-30 FCA US LLC.
    jeep

    // jetzt : 2014-01-09 Binky Moon, LLC
    jetzt

    // jewelry : 2015-03-05 Binky Moon, LLC
    jewelry

    // jio : 2015-04-02 Reliance Industries Limited
    jio

    // jll : 2015-04-02 Jones Lang LaSalle Incorporated
    jll

    // jmp : 2015-03-26 Matrix IP LLC
    jmp

    // jnj : 2015-06-18 Johnson & Johnson Services, Inc.
    jnj

    // joburg : 2014-03-24 ZA Central Registry NPC trading as ZA Central Registry
    joburg

    // jot : 2014-12-18 Amazon Registry Services, Inc.
    jot

    // joy : 2014-12-18 Amazon Registry Services, Inc.
    joy

    // jpmorgan : 2015-04-30 JPMorgan Chase Bank, National Association
    jpmorgan

    // jprs : 2014-09-18 Japan Registry Services Co., Ltd.
    jprs

    // juegos : 2014-03-20 Internet Naming Company LLC
    juegos

    // juniper : 2015-07-30 JUNIPER NETWORKS, INC.
    juniper

    // kaufen : 2013-11-07 Dog Beach, LLC
    kaufen

    // kddi : 2014-09-12 KDDI CORPORATION
    kddi

    // kerryhotels : 2015-04-30 Kerry Trading Co. Limited
    kerryhotels

    // kerrylogistics : 2015-04-09 Kerry Trading Co. Limited
    kerrylogistics

    // kerryproperties : 2015-04-09 Kerry Trading Co. Limited
    kerryproperties

    // kfh : 2014-12-04 Kuwait Finance House
    kfh

    // kia : 2015-07-09 KIA MOTORS CORPORATION
    kia

    // kids : 2021-08-13 DotKids Foundation Limited
    kids

    // kim : 2013-09-23 Identity Digital Limited
    kim

    // kinder : 2014-11-07 Ferrero Trading Lux S.A.
    kinder

    // kindle : 2015-06-25 Amazon Registry Services, Inc.
    kindle

    // kitchen : 2013-09-20 Binky Moon, LLC
    kitchen

    // kiwi : 2013-09-20 DOT KIWI LIMITED
    kiwi

    // koeln : 2014-01-09 dotKoeln GmbH
    koeln

    // komatsu : 2015-01-08 Komatsu Ltd.
    komatsu

    // kosher : 2015-08-20 Kosher Marketing Assets LLC
    kosher

    // kpmg : 2015-04-23 KPMG International Cooperative (KPMG International Genossenschaft)
    kpmg

    // kpn : 2015-01-08 Koninklijke KPN N.V.
    kpn

    // krd : 2013-12-05 KRG Department of Information Technology
    krd

    // kred : 2013-12-19 KredTLD Pty Ltd
    kred

    // kuokgroup : 2015-04-09 Kerry Trading Co. Limited
    kuokgroup

    // kyoto : 2014-11-07 Academic Institution: Kyoto Jyoho Gakuen
    kyoto

    // lacaixa : 2014-01-09 Fundación Bancaria Caixa d’Estalvis i Pensions de Barcelona, “la Caixa”
    lacaixa

    // lamborghini : 2015-06-04 Automobili Lamborghini S.p.A.
    lamborghini

    // lamer : 2015-10-01 The Estée Lauder Companies Inc.
    lamer

    // lancaster : 2015-02-12 LANCASTER
    lancaster

    // lancia : 2015-07-31 Fiat Chrysler Automobiles N.V.
    lancia

    // land : 2013-09-10 Binky Moon, LLC
    land

    // landrover : 2014-11-13 Jaguar Land Rover Ltd
    landrover

    // lanxess : 2015-07-30 LANXESS Corporation
    lanxess

    // lasalle : 2015-04-02 Jones Lang LaSalle Incorporated
    lasalle

    // lat : 2014-10-16 XYZ.COM LLC
    lat

    // latino : 2015-07-30 Dish DBS Corporation
    latino

    // latrobe : 2014-06-16 La Trobe University
    latrobe

    // law : 2015-01-22 Registry Services, LLC
    law

    // lawyer : 2014-03-20 Dog Beach, LLC
    lawyer

    // lds : 2014-03-20 IRI Domain Management, LLC
    lds

    // lease : 2014-03-06 Binky Moon, LLC
    lease

    // leclerc : 2014-08-07 A.C.D. LEC Association des Centres Distributeurs Edouard Leclerc
    leclerc

    // lefrak : 2015-07-16 LeFrak Organization, Inc.
    lefrak

    // legal : 2014-10-16 Binky Moon, LLC
    legal

    // lego : 2015-07-16 LEGO Juris A/S
    lego

    // lexus : 2015-04-23 TOYOTA MOTOR CORPORATION
    lexus

    // lgbt : 2014-05-08 Identity Digital Limited
    lgbt

    // lidl : 2014-09-18 Schwarz Domains und Services GmbH & Co. KG
    lidl

    // life : 2014-02-06 Binky Moon, LLC
    life

    // lifeinsurance : 2015-01-15 American Council of Life Insurers
    lifeinsurance

    // lifestyle : 2014-12-11 Lifestyle Domain Holdings, Inc.
    lifestyle

    // lighting : 2013-08-27 Binky Moon, LLC
    lighting

    // like : 2014-12-18 Amazon Registry Services, Inc.
    like

    // lilly : 2015-07-31 Eli Lilly and Company
    lilly

    // limited : 2014-03-06 Binky Moon, LLC
    limited

    // limo : 2013-10-17 Binky Moon, LLC
    limo

    // lincoln : 2014-11-13 Ford Motor Company
    lincoln

    // linde : 2014-12-04 Linde Aktiengesellschaft
    linde

    // link : 2013-11-14 Nova Registry Ltd
    link

    // lipsy : 2015-06-25 Lipsy Ltd
    lipsy

    // live : 2014-12-04 Dog Beach, LLC
    live

    // living : 2015-07-30 Lifestyle Domain Holdings, Inc.
    living

    // llc : 2017-12-14 Identity Digital Limited
    llc

    // llp : 2019-08-26 Intercap Registry Inc.
    llp

    // loan : 2014-11-20 dot Loan Limited
    loan

    // loans : 2014-03-20 Binky Moon, LLC
    loans

    // locker : 2015-06-04 Dish DBS Corporation
    locker

    // locus : 2015-06-25 Locus Analytics LLC
    locus

    // loft : 2015-07-30 Annco, Inc.
    loft

    // lol : 2015-01-30 XYZ.COM LLC
    lol

    // london : 2013-11-14 Dot London Domains Limited
    london

    // lotte : 2014-11-07 Lotte Holdings Co., Ltd.
    lotte

    // lotto : 2014-04-10 Identity Digital Limited
    lotto

    // love : 2014-12-22 Merchant Law Group LLP
    love

    // lpl : 2015-07-30 LPL Holdings, Inc.
    lpl

    // lplfinancial : 2015-07-30 LPL Holdings, Inc.
    lplfinancial

    // ltd : 2014-09-25 Binky Moon, LLC
    ltd

    // ltda : 2014-04-17 InterNetX, Corp
    ltda

    // lundbeck : 2015-08-06 H. Lundbeck A/S
    lundbeck

    // luxe : 2014-01-09 Registry Services, LLC
    luxe

    // luxury : 2013-10-17 Luxury Partners, LLC
    luxury

    // macys : 2015-07-31 Macys, Inc.
    macys

    // madrid : 2014-05-01 Comunidad de Madrid
    madrid

    // maif : 2014-10-02 Mutuelle Assurance Instituteur France (MAIF)
    maif

    // maison : 2013-12-05 Binky Moon, LLC
    maison

    // makeup : 2015-01-15 XYZ.COM LLC
    makeup

    // man : 2014-12-04 MAN SE
    man

    // management : 2013-11-07 Binky Moon, LLC
    management

    // mango : 2013-10-24 PUNTO FA S.L.
    mango

    // map : 2016-06-09 Charleston Road Registry Inc.
    map

    // market : 2014-03-06 Dog Beach, LLC
    market

    // marketing : 2013-11-07 Binky Moon, LLC
    marketing

    // markets : 2014-12-11 Dog Beach, LLC
    markets

    // marriott : 2014-10-09 Marriott Worldwide Corporation
    marriott

    // marshalls : 2015-07-16 The TJX Companies, Inc.
    marshalls

    // maserati : 2015-07-31 Fiat Chrysler Automobiles N.V.
    maserati

    // mattel : 2015-08-06 Mattel Sites, Inc.
    mattel

    // mba : 2015-04-02 Binky Moon, LLC
    mba

    // mckinsey : 2015-07-31 McKinsey Holdings, Inc.
    mckinsey

    // med : 2015-08-06 Medistry LLC
    med

    // media : 2014-03-06 Binky Moon, LLC
    media

    // meet : 2014-01-16 Charleston Road Registry Inc.
    meet

    // melbourne : 2014-05-29 The Crown in right of the State of Victoria, represented by its Department of State Development, Business and Innovation
    melbourne

    // meme : 2014-01-30 Charleston Road Registry Inc.
    meme

    // memorial : 2014-10-16 Dog Beach, LLC
    memorial

    // men : 2015-02-26 Exclusive Registry Limited
    men

    // menu : 2013-09-11 Dot Menu Registry, LLC
    menu

    // merckmsd : 2016-07-14 MSD Registry Holdings, Inc.
    merckmsd

    // miami : 2013-12-19 Registry Services, LLC
    miami

    // microsoft : 2014-12-18 Microsoft Corporation
    microsoft

    // mini : 2014-01-09 Bayerische Motoren Werke Aktiengesellschaft
    mini

    // mint : 2015-07-30 Intuit Administrative Services, Inc.
    mint

    // mit : 2015-07-02 Massachusetts Institute of Technology
    mit

    // mitsubishi : 2015-07-23 Mitsubishi Corporation
    mitsubishi

    // mlb : 2015-05-21 MLB Advanced Media DH, LLC
    mlb

    // mls : 2015-04-23 The Canadian Real Estate Association
    mls

    // mma : 2014-11-07 MMA IARD
    mma

    // mobile : 2016-06-02 Dish DBS Corporation
    mobile

    // moda : 2013-11-07 Dog Beach, LLC
    moda

    // moe : 2013-11-13 Interlink Systems Innovation Institute K.K.
    moe

    // moi : 2014-12-18 Amazon Registry Services, Inc.
    moi

    // mom : 2015-04-16 XYZ.COM LLC
    mom

    // monash : 2013-09-30 Monash University
    monash

    // money : 2014-10-16 Binky Moon, LLC
    money

    // monster : 2015-09-11 XYZ.COM LLC
    monster

    // mormon : 2013-12-05 IRI Domain Management, LLC
    mormon

    // mortgage : 2014-03-20 Dog Beach, LLC
    mortgage

    // moscow : 2013-12-19 Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
    moscow

    // moto : 2015-06-04 Motorola Trademark Holdings, LLC
    moto

    // motorcycles : 2014-01-09 XYZ.COM LLC
    motorcycles

    // mov : 2014-01-30 Charleston Road Registry Inc.
    mov

    // movie : 2015-02-05 Binky Moon, LLC
    movie

    // msd : 2015-07-23 MSD Registry Holdings, Inc.
    msd

    // mtn : 2014-12-04 MTN Dubai Limited
    mtn

    // mtr : 2015-03-12 MTR Corporation Limited
    mtr

    // music : 2021-05-04 DotMusic Limited
    music

    // mutual : 2015-04-02 Northwestern Mutual MU TLD Registry, LLC
    mutual

    // nab : 2015-08-20 National Australia Bank Limited
    nab

    // nagoya : 2013-10-24 GMO Registry, Inc.
    nagoya

    // natura : 2015-03-12 NATURA COSMÉTICOS S.A.
    natura

    // navy : 2014-03-06 Dog Beach, LLC
    navy

    // nba : 2015-07-31 NBA REGISTRY, LLC
    nba

    // nec : 2015-01-08 NEC Corporation
    nec

    // netbank : 2014-06-26 COMMONWEALTH BANK OF AUSTRALIA
    netbank

    // netflix : 2015-06-18 Netflix, Inc.
    netflix

    // network : 2013-11-14 Binky Moon, LLC
    network

    // neustar : 2013-12-05 NeuStar, Inc.
    neustar

    // new : 2014-01-30 Charleston Road Registry Inc.
    new

    // news : 2014-12-18 Dog Beach, LLC
    news

    // next : 2015-06-18 Next plc
    next

    // nextdirect : 2015-06-18 Next plc
    nextdirect

    // nexus : 2014-07-24 Charleston Road Registry Inc.
    nexus

    // nfl : 2015-07-23 NFL Reg Ops LLC
    nfl

    // ngo : 2014-03-06 Public Interest Registry
    ngo

    // nhk : 2014-02-13 Japan Broadcasting Corporation (NHK)
    nhk

    // nico : 2014-12-04 DWANGO Co., Ltd.
    nico

    // nike : 2015-07-23 NIKE, Inc.
    nike

    // nikon : 2015-05-21 NIKON CORPORATION
    nikon

    // ninja : 2013-11-07 Dog Beach, LLC
    ninja

    // nissan : 2014-03-27 NISSAN MOTOR CO., LTD.
    nissan

    // nissay : 2015-10-29 Nippon Life Insurance Company
    nissay

    // nokia : 2015-01-08 Nokia Corporation
    nokia

    // northwesternmutual : 2015-06-18 Northwestern Mutual Registry, LLC
    northwesternmutual

    // norton : 2014-12-04 NortonLifeLock Inc.
    norton

    // now : 2015-06-25 Amazon Registry Services, Inc.
    now

    // nowruz : 2014-09-04 Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
    nowruz

    // nowtv : 2015-05-14 Starbucks (HK) Limited
    nowtv

    // nra : 2014-05-22 NRA Holdings Company, INC.
    nra

    // nrw : 2013-11-21 Minds + Machines GmbH
    nrw

    // ntt : 2014-10-31 NIPPON TELEGRAPH AND TELEPHONE CORPORATION
    ntt

    // nyc : 2014-01-23 The City of New York by and through the New York City Department of Information Technology & Telecommunications
    nyc

    // obi : 2014-09-25 OBI Group Holding SE & Co. KGaA
    obi

    // observer : 2015-04-30 Dog Beach, LLC
    observer

    // office : 2015-03-12 Microsoft Corporation
    office

    // okinawa : 2013-12-05 BRregistry, Inc.
    okinawa

    // olayan : 2015-05-14 Crescent Holding GmbH
    olayan

    // olayangroup : 2015-05-14 Crescent Holding GmbH
    olayangroup

    // oldnavy : 2015-07-31 The Gap, Inc.
    oldnavy

    // ollo : 2015-06-04 Dish DBS Corporation
    ollo

    // omega : 2015-01-08 The Swatch Group Ltd
    omega

    // one : 2014-11-07 One.com A/S
    one

    // ong : 2014-03-06 Public Interest Registry
    ong

    // onl : 2013-09-16 iRegistry GmbH
    onl

    // online : 2015-01-15 Radix FZC
    online

    // ooo : 2014-01-09 INFIBEAM AVENUES LIMITED
    ooo

    // open : 2015-07-31 American Express Travel Related Services Company, Inc.
    open

    // oracle : 2014-06-19 Oracle Corporation
    oracle

    // orange : 2015-03-12 Orange Brand Services Limited
    orange

    // organic : 2014-03-27 Identity Digital Limited
    organic

    // origins : 2015-10-01 The Estée Lauder Companies Inc.
    origins

    // osaka : 2014-09-04 Osaka Registry Co., Ltd.
    osaka

    // otsuka : 2013-10-11 Otsuka Holdings Co., Ltd.
    otsuka

    // ott : 2015-06-04 Dish DBS Corporation
    ott

    // ovh : 2014-01-16 MédiaBC
    ovh

    // page : 2014-12-04 Charleston Road Registry Inc.
    page

    // panasonic : 2015-07-30 Panasonic Corporation
    panasonic

    // paris : 2014-01-30 City of Paris
    paris

    // pars : 2014-09-04 Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
    pars

    // partners : 2013-12-05 Binky Moon, LLC
    partners

    // parts : 2013-12-05 Binky Moon, LLC
    parts

    // party : 2014-09-11 Blue Sky Registry Limited
    party

    // passagens : 2015-03-05 Travel Reservations SRL
    passagens

    // pay : 2015-08-27 Amazon Registry Services, Inc.
    pay

    // pccw : 2015-05-14 PCCW Enterprises Limited
    pccw

    // pet : 2015-05-07 Identity Digital Limited
    pet

    // pfizer : 2015-09-11 Pfizer Inc.
    pfizer

    // pharmacy : 2014-06-19 National Association of Boards of Pharmacy
    pharmacy

    // phd : 2016-07-28 Charleston Road Registry Inc.
    phd

    // philips : 2014-11-07 Koninklijke Philips N.V.
    philips

    // phone : 2016-06-02 Dish DBS Corporation
    phone

    // photo : 2013-11-14 Registry Services, LLC
    photo

    // photography : 2013-09-20 Binky Moon, LLC
    photography

    // photos : 2013-10-17 Binky Moon, LLC
    photos

    // physio : 2014-05-01 PhysBiz Pty Ltd
    physio

    // pics : 2013-11-14 XYZ.COM LLC
    pics

    // pictet : 2014-06-26 Pictet Europe S.A.
    pictet

    // pictures : 2014-03-06 Binky Moon, LLC
    pictures

    // pid : 2015-01-08 Top Level Spectrum, Inc.
    pid

    // pin : 2014-12-18 Amazon Registry Services, Inc.
    pin

    // ping : 2015-06-11 Ping Registry Provider, Inc.
    ping

    // pink : 2013-10-01 Identity Digital Limited
    pink

    // pioneer : 2015-07-16 Pioneer Corporation
    pioneer

    // pizza : 2014-06-26 Binky Moon, LLC
    pizza

    // place : 2014-04-24 Binky Moon, LLC
    place

    // play : 2015-03-05 Charleston Road Registry Inc.
    play

    // playstation : 2015-07-02 Sony Interactive Entertainment Inc.
    playstation

    // plumbing : 2013-09-10 Binky Moon, LLC
    plumbing

    // plus : 2015-02-05 Binky Moon, LLC
    plus

    // pnc : 2015-07-02 PNC Domain Co., LLC
    pnc

    // pohl : 2014-06-23 Deutsche Vermögensberatung Aktiengesellschaft DVAG
    pohl

    // poker : 2014-07-03 Identity Digital Limited
    poker

    // politie : 2015-08-20 Politie Nederland
    politie

    // porn : 2014-10-16 ICM Registry PN LLC
    porn

    // pramerica : 2015-07-30 Prudential Financial, Inc.
    pramerica

    // praxi : 2013-12-05 Praxi S.p.A.
    praxi

    // press : 2014-04-03 Radix FZC
    press

    // prime : 2015-06-25 Amazon Registry Services, Inc.
    prime

    // prod : 2014-01-23 Charleston Road Registry Inc.
    prod

    // productions : 2013-12-05 Binky Moon, LLC
    productions

    // prof : 2014-07-24 Charleston Road Registry Inc.
    prof

    // progressive : 2015-07-23 Progressive Casualty Insurance Company
    progressive

    // promo : 2014-12-18 Identity Digital Limited
    promo

    // properties : 2013-12-05 Binky Moon, LLC
    properties

    // property : 2014-05-22 Internet Naming Company LLC
    property

    // protection : 2015-04-23 XYZ.COM LLC
    protection

    // pru : 2015-07-30 Prudential Financial, Inc.
    pru

    // prudential : 2015-07-30 Prudential Financial, Inc.
    prudential

    // pub : 2013-12-12 Dog Beach, LLC
    pub

    // pwc : 2015-10-29 PricewaterhouseCoopers LLP
    pwc

    // qpon : 2013-11-14 dotCOOL, Inc.
    qpon

    // quebec : 2013-12-19 PointQuébec Inc
    quebec

    // quest : 2015-03-26 XYZ.COM LLC
    quest

    // racing : 2014-12-04 Premier Registry Limited
    racing

    // radio : 2016-07-21 European Broadcasting Union (EBU)
    radio

    // read : 2014-12-18 Amazon Registry Services, Inc.
    read

    // realestate : 2015-09-11 dotRealEstate LLC
    realestate

    // realtor : 2014-05-29 Real Estate Domains LLC
    realtor

    // realty : 2015-03-19 Dog Beach, LLC
    realty

    // recipes : 2013-10-17 Binky Moon, LLC
    recipes

    // red : 2013-11-07 Identity Digital Limited
    red

    // redstone : 2014-10-31 Redstone Haute Couture Co., Ltd.
    redstone

    // redumbrella : 2015-03-26 Travelers TLD, LLC
    redumbrella

    // rehab : 2014-03-06 Dog Beach, LLC
    rehab

    // reise : 2014-03-13 Binky Moon, LLC
    reise

    // reisen : 2014-03-06 Binky Moon, LLC
    reisen

    // reit : 2014-09-04 National Association of Real Estate Investment Trusts, Inc.
    reit

    // reliance : 2015-04-02 Reliance Industries Limited
    reliance

    // ren : 2013-12-12 ZDNS International Limited
    ren

    // rent : 2014-12-04 XYZ.COM LLC
    rent

    // rentals : 2013-12-05 Binky Moon, LLC
    rentals

    // repair : 2013-11-07 Binky Moon, LLC
    repair

    // report : 2013-12-05 Binky Moon, LLC
    report

    // republican : 2014-03-20 Dog Beach, LLC
    republican

    // rest : 2013-12-19 Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
    rest

    // restaurant : 2014-07-03 Binky Moon, LLC
    restaurant

    // review : 2014-11-20 dot Review Limited
    review

    // reviews : 2013-09-13 Dog Beach, LLC
    reviews

    // rexroth : 2015-06-18 Robert Bosch GMBH
    rexroth

    // rich : 2013-11-21 iRegistry GmbH
    rich

    // richardli : 2015-05-14 Pacific Century Asset Management (HK) Limited
    richardli

    // ricoh : 2014-11-20 Ricoh Company, Ltd.
    ricoh

    // ril : 2015-04-02 Reliance Industries Limited
    ril

    // rio : 2014-02-27 Empresa Municipal de Informática SA - IPLANRIO
    rio

    // rip : 2014-07-10 Dog Beach, LLC
    rip

    // rocher : 2014-12-18 Ferrero Trading Lux S.A.
    rocher

    // rocks : 2013-11-14 Dog Beach, LLC
    rocks

    // rodeo : 2013-12-19 Registry Services, LLC
    rodeo

    // rogers : 2015-08-06 Rogers Communications Canada Inc.
    rogers

    // room : 2014-12-18 Amazon Registry Services, Inc.
    room

    // rsvp : 2014-05-08 Charleston Road Registry Inc.
    rsvp

    // rugby : 2016-12-15 World Rugby Strategic Developments Limited
    rugby

    // ruhr : 2013-10-02 dotSaarland GmbH
    ruhr

    // run : 2015-03-19 Binky Moon, LLC
    run

    // rwe : 2015-04-02 RWE AG
    rwe

    // ryukyu : 2014-01-09 BRregistry, Inc.
    ryukyu

    // saarland : 2013-12-12 dotSaarland GmbH
    saarland

    // safe : 2014-12-18 Amazon Registry Services, Inc.
    safe

    // safety : 2015-01-08 Safety Registry Services, LLC.
    safety

    // sakura : 2014-12-18 SAKURA Internet Inc.
    sakura

    // sale : 2014-10-16 Dog Beach, LLC
    sale

    // salon : 2014-12-11 Binky Moon, LLC
    salon

    // samsclub : 2015-07-31 Wal-Mart Stores, Inc.
    samsclub

    // samsung : 2014-04-03 SAMSUNG SDS CO., LTD
    samsung

    // sandvik : 2014-11-13 Sandvik AB
    sandvik

    // sandvikcoromant : 2014-11-07 Sandvik AB
    sandvikcoromant

    // sanofi : 2014-10-09 Sanofi
    sanofi

    // sap : 2014-03-27 SAP AG
    sap

    // sarl : 2014-07-03 Binky Moon, LLC
    sarl

    // sas : 2015-04-02 Research IP LLC
    sas

    // save : 2015-06-25 Amazon Registry Services, Inc.
    save

    // saxo : 2014-10-31 Saxo Bank A/S
    saxo

    // sbi : 2015-03-12 STATE BANK OF INDIA
    sbi

    // sbs : 2014-11-07 ShortDot SA
    sbs

    // sca : 2014-03-13 SVENSKA CELLULOSA AKTIEBOLAGET SCA (publ)
    sca

    // scb : 2014-02-20 The Siam Commercial Bank Public Company Limited ("SCB")
    scb

    // schaeffler : 2015-08-06 Schaeffler Technologies AG & Co. KG
    schaeffler

    // schmidt : 2014-04-03 SCHMIDT GROUPE S.A.S.
    schmidt

    // scholarships : 2014-04-24 Scholarships.com, LLC
    scholarships

    // school : 2014-12-18 Binky Moon, LLC
    school

    // schule : 2014-03-06 Binky Moon, LLC
    schule

    // schwarz : 2014-09-18 Schwarz Domains und Services GmbH & Co. KG
    schwarz

    // science : 2014-09-11 dot Science Limited
    science

    // scot : 2014-01-23 Dot Scot Registry Limited
    scot

    // search : 2016-06-09 Charleston Road Registry Inc.
    search

    // seat : 2014-05-22 SEAT, S.A. (Sociedad Unipersonal)
    seat

    // secure : 2015-08-27 Amazon Registry Services, Inc.
    secure

    // security : 2015-05-14 XYZ.COM LLC
    security

    // seek : 2014-12-04 Seek Limited
    seek

    // select : 2015-10-08 Registry Services, LLC
    select

    // sener : 2014-10-24 Sener Ingeniería y Sistemas, S.A.
    sener

    // services : 2014-02-27 Binky Moon, LLC
    services

    // ses : 2015-07-23 SES
    ses

    // seven : 2015-08-06 Seven West Media Ltd
    seven

    // sew : 2014-07-17 SEW-EURODRIVE GmbH & Co KG
    sew

    // sex : 2014-11-13 ICM Registry SX LLC
    sex

    // sexy : 2013-09-11 Internet Naming Company LLC
    sexy

    // sfr : 2015-08-13 Societe Francaise du Radiotelephone - SFR
    sfr

    // shangrila : 2015-09-03 Shangri‐La International Hotel Management Limited
    shangrila

    // sharp : 2014-05-01 Sharp Corporation
    sharp

    // shaw : 2015-04-23 Shaw Cablesystems G.P.
    shaw

    // shell : 2015-07-30 Shell Information Technology International Inc
    shell

    // shia : 2014-09-04 Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
    shia

    // shiksha : 2013-11-14 Identity Digital Limited
    shiksha

    // shoes : 2013-10-02 Binky Moon, LLC
    shoes

    // shop : 2016-04-08 GMO Registry, Inc.
    shop

    // shopping : 2016-03-31 Binky Moon, LLC
    shopping

    // shouji : 2015-01-08 Beijing Qihu Keji Co., Ltd.
    shouji

    // show : 2015-03-05 Binky Moon, LLC
    show

    // showtime : 2015-08-06 CBS Domains Inc.
    showtime

    // silk : 2015-06-25 Amazon Registry Services, Inc.
    silk

    // sina : 2015-03-12 Sina Corporation
    sina

    // singles : 2013-08-27 Binky Moon, LLC
    singles

    // site : 2015-01-15 Radix FZC
    site

    // ski : 2015-04-09 Identity Digital Limited
    ski

    // skin : 2015-01-15 XYZ.COM LLC
    skin

    // sky : 2014-06-19 Sky International AG
    sky

    // skype : 2014-12-18 Microsoft Corporation
    skype

    // sling : 2015-07-30 DISH Technologies L.L.C.
    sling

    // smart : 2015-07-09 Smart Communications, Inc. (SMART)
    smart

    // smile : 2014-12-18 Amazon Registry Services, Inc.
    smile

    // sncf : 2015-02-19 Société Nationale des Chemins de fer Francais S N C F
    sncf

    // soccer : 2015-03-26 Binky Moon, LLC
    soccer

    // social : 2013-11-07 Dog Beach, LLC
    social

    // softbank : 2015-07-02 SoftBank Group Corp.
    softbank

    // software : 2014-03-20 Dog Beach, LLC
    software

    // sohu : 2013-12-19 Sohu.com Limited
    sohu

    // solar : 2013-11-07 Binky Moon, LLC
    solar

    // solutions : 2013-11-07 Binky Moon, LLC
    solutions

    // song : 2015-02-26 Amazon Registry Services, Inc.
    song

    // sony : 2015-01-08 Sony Corporation
    sony

    // soy : 2014-01-23 Charleston Road Registry Inc.
    soy

    // spa : 2019-09-19 Asia Spa and Wellness Promotion Council Limited
    spa

    // space : 2014-04-03 Radix FZC
    space

    // sport : 2017-11-16 Global Association of International Sports Federations (GAISF)
    sport

    // spot : 2015-02-26 Amazon Registry Services, Inc.
    spot

    // srl : 2015-05-07 InterNetX, Corp
    srl

    // stada : 2014-11-13 STADA Arzneimittel AG
    stada

    // staples : 2015-07-30 Staples, Inc.
    staples

    // star : 2015-01-08 Star India Private Limited
    star

    // statebank : 2015-03-12 STATE BANK OF INDIA
    statebank

    // statefarm : 2015-07-30 State Farm Mutual Automobile Insurance Company
    statefarm

    // stc : 2014-10-09 Saudi Telecom Company
    stc

    // stcgroup : 2014-10-09 Saudi Telecom Company
    stcgroup

    // stockholm : 2014-12-18 Stockholms kommun
    stockholm

    // storage : 2014-12-22 XYZ.COM LLC
    storage

    // store : 2015-04-09 Radix FZC
    store

    // stream : 2016-01-08 dot Stream Limited
    stream

    // studio : 2015-02-11 Dog Beach, LLC
    studio

    // study : 2014-12-11 Registry Services, LLC
    study

    // style : 2014-12-04 Binky Moon, LLC
    style

    // sucks : 2014-12-22 Vox Populi Registry Ltd.
    sucks

    // supplies : 2013-12-19 Binky Moon, LLC
    supplies

    // supply : 2013-12-19 Binky Moon, LLC
    supply

    // support : 2013-10-24 Binky Moon, LLC
    support

    // surf : 2014-01-09 Registry Services, LLC
    surf

    // surgery : 2014-03-20 Binky Moon, LLC
    surgery

    // suzuki : 2014-02-20 SUZUKI MOTOR CORPORATION
    suzuki

    // swatch : 2015-01-08 The Swatch Group Ltd
    swatch

    // swiss : 2014-10-16 Swiss Confederation
    swiss

    // sydney : 2014-09-18 State of New South Wales, Department of Premier and Cabinet
    sydney

    // systems : 2013-11-07 Binky Moon, LLC
    systems

    // tab : 2014-12-04 Tabcorp Holdings Limited
    tab

    // taipei : 2014-07-10 Taipei City Government
    taipei

    // talk : 2015-04-09 Amazon Registry Services, Inc.
    talk

    // taobao : 2015-01-15 Alibaba Group Holding Limited
    taobao

    // target : 2015-07-31 Target Domain Holdings, LLC
    target

    // tatamotors : 2015-03-12 Tata Motors Ltd
    tatamotors

    // tatar : 2014-04-24 Limited Liability Company "Coordination Center of Regional Domain of Tatarstan Republic"
    tatar

    // tattoo : 2013-08-30 Top Level Design, LLC
    tattoo

    // tax : 2014-03-20 Binky Moon, LLC
    tax

    // taxi : 2015-03-19 Binky Moon, LLC
    taxi

    // tci : 2014-09-12 Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
    tci

    // tdk : 2015-06-11 TDK Corporation
    tdk

    // team : 2015-03-05 Binky Moon, LLC
    team

    // tech : 2015-01-30 Radix FZC
    tech

    // technology : 2013-09-13 Binky Moon, LLC
    technology

    // temasek : 2014-08-07 Temasek Holdings (Private) Limited
    temasek

    // tennis : 2014-12-04 Binky Moon, LLC
    tennis

    // teva : 2015-07-02 Teva Pharmaceutical Industries Limited
    teva

    // thd : 2015-04-02 Home Depot Product Authority, LLC
    thd

    // theater : 2015-03-19 Binky Moon, LLC
    theater

    // theatre : 2015-05-07 XYZ.COM LLC
    theatre

    // tiaa : 2015-07-23 Teachers Insurance and Annuity Association of America
    tiaa

    // tickets : 2015-02-05 XYZ.COM LLC
    tickets

    // tienda : 2013-11-14 Binky Moon, LLC
    tienda

    // tiffany : 2015-01-30 Tiffany and Company
    tiffany

    // tips : 2013-09-20 Binky Moon, LLC
    tips

    // tires : 2014-11-07 Binky Moon, LLC
    tires

    // tirol : 2014-04-24 punkt Tirol GmbH
    tirol

    // tjmaxx : 2015-07-16 The TJX Companies, Inc.
    tjmaxx

    // tjx : 2015-07-16 The TJX Companies, Inc.
    tjx

    // tkmaxx : 2015-07-16 The TJX Companies, Inc.
    tkmaxx

    // tmall : 2015-01-15 Alibaba Group Holding Limited
    tmall

    // today : 2013-09-20 Binky Moon, LLC
    today

    // tokyo : 2013-11-13 GMO Registry, Inc.
    tokyo

    // tools : 2013-11-21 Binky Moon, LLC
    tools

    // top : 2014-03-20 .TOP Registry
    top

    // toray : 2014-12-18 Toray Industries, Inc.
    toray

    // toshiba : 2014-04-10 TOSHIBA Corporation
    toshiba

    // total : 2015-08-06 TOTAL SE
    total

    // tours : 2015-01-22 Binky Moon, LLC
    tours

    // town : 2014-03-06 Binky Moon, LLC
    town

    // toyota : 2015-04-23 TOYOTA MOTOR CORPORATION
    toyota

    // toys : 2014-03-06 Binky Moon, LLC
    toys

    // trade : 2014-01-23 Elite Registry Limited
    trade

    // trading : 2014-12-11 Dog Beach, LLC
    trading

    // training : 2013-11-07 Binky Moon, LLC
    training

    // travel : 2015-10-09 Dog Beach, LLC
    travel

    // travelchannel : 2015-07-02 Lifestyle Domain Holdings, Inc.
    travelchannel

    // travelers : 2015-03-26 Travelers TLD, LLC
    travelers

    // travelersinsurance : 2015-03-26 Travelers TLD, LLC
    travelersinsurance

    // trust : 2014-10-16 Internet Naming Company LLC
    trust

    // trv : 2015-03-26 Travelers TLD, LLC
    trv

    // tube : 2015-06-11 Latin American Telecom LLC
    tube

    // tui : 2014-07-03 TUI AG
    tui

    // tunes : 2015-02-26 Amazon Registry Services, Inc.
    tunes

    // tushu : 2014-12-18 Amazon Registry Services, Inc.
    tushu

    // tvs : 2015-02-19 T V SUNDRAM IYENGAR  & SONS LIMITED
    tvs

    // ubank : 2015-08-20 National Australia Bank Limited
    ubank

    // ubs : 2014-12-11 UBS AG
    ubs

    // unicom : 2015-10-15 China United Network Communications Corporation Limited
    unicom

    // university : 2014-03-06 Binky Moon, LLC
    university

    // uno : 2013-09-11 Radix FZC
    uno

    // uol : 2014-05-01 UBN INTERNET LTDA.
    uol

    // ups : 2015-06-25 UPS Market Driver, Inc.
    ups

    // vacations : 2013-12-05 Binky Moon, LLC
    vacations

    // vana : 2014-12-11 Lifestyle Domain Holdings, Inc.
    vana

    // vanguard : 2015-09-03 The Vanguard Group, Inc.
    vanguard

    // vegas : 2014-01-16 Dot Vegas, Inc.
    vegas

    // ventures : 2013-08-27 Binky Moon, LLC
    ventures

    // verisign : 2015-08-13 VeriSign, Inc.
    verisign

    // versicherung : 2014-03-20 tldbox GmbH
    versicherung

    // vet : 2014-03-06 Dog Beach, LLC
    vet

    // viajes : 2013-10-17 Binky Moon, LLC
    viajes

    // video : 2014-10-16 Dog Beach, LLC
    video

    // vig : 2015-05-14 VIENNA INSURANCE GROUP AG Wiener Versicherung Gruppe
    vig

    // viking : 2015-04-02 Viking River Cruises (Bermuda) Ltd.
    viking

    // villas : 2013-12-05 Binky Moon, LLC
    villas

    // vin : 2015-06-18 Binky Moon, LLC
    vin

    // vip : 2015-01-22 Registry Services, LLC
    vip

    // virgin : 2014-09-25 Virgin Enterprises Limited
    virgin

    // visa : 2015-07-30 Visa Worldwide Pte. Limited
    visa

    // vision : 2013-12-05 Binky Moon, LLC
    vision

    // viva : 2014-11-07 Saudi Telecom Company
    viva

    // vivo : 2015-07-31 Telefonica Brasil S.A.
    vivo

    // vlaanderen : 2014-02-06 DNS.be vzw
    vlaanderen

    // vodka : 2013-12-19 Registry Services, LLC
    vodka

    // volkswagen : 2015-05-14 Volkswagen Group of America Inc.
    volkswagen

    // volvo : 2015-11-12 Volvo Holding Sverige Aktiebolag
    volvo

    // vote : 2013-11-21 Monolith Registry LLC
    vote

    // voting : 2013-11-13 Valuetainment Corp.
    voting

    // voto : 2013-11-21 Monolith Registry LLC
    voto

    // voyage : 2013-08-27 Binky Moon, LLC
    voyage

    // vuelos : 2015-03-05 Travel Reservations SRL
    vuelos

    // wales : 2014-05-08 Nominet UK
    wales

    // walmart : 2015-07-31 Wal-Mart Stores, Inc.
    walmart

    // walter : 2014-11-13 Sandvik AB
    walter

    // wang : 2013-10-24 Zodiac Wang Limited
    wang

    // wanggou : 2014-12-18 Amazon Registry Services, Inc.
    wanggou

    // watch : 2013-11-14 Binky Moon, LLC
    watch

    // watches : 2014-12-22 Identity Digital Limited
    watches

    // weather : 2015-01-08 International Business Machines Corporation
    weather

    // weatherchannel : 2015-03-12 International Business Machines Corporation
    weatherchannel

    // webcam : 2014-01-23 dot Webcam Limited
    webcam

    // weber : 2015-06-04 Saint-Gobain Weber SA
    weber

    // website : 2014-04-03 Radix FZC
    website

    // wedding : 2014-04-24 Registry Services, LLC
    wedding

    // weibo : 2015-03-05 Sina Corporation
    weibo

    // weir : 2015-01-29 Weir Group IP Limited
    weir

    // whoswho : 2014-02-20 Who's Who Registry
    whoswho

    // wien : 2013-10-28 punkt.wien GmbH
    wien

    // wiki : 2013-11-07 Top Level Design, LLC
    wiki

    // williamhill : 2014-03-13 William Hill Organization Limited
    williamhill

    // win : 2014-11-20 First Registry Limited
    win

    // windows : 2014-12-18 Microsoft Corporation
    windows

    // wine : 2015-06-18 Binky Moon, LLC
    wine

    // winners : 2015-07-16 The TJX Companies, Inc.
    winners

    // wme : 2014-02-13 William Morris Endeavor Entertainment, LLC
    wme

    // wolterskluwer : 2015-08-06 Wolters Kluwer N.V.
    wolterskluwer

    // woodside : 2015-07-09 Woodside Petroleum Limited
    woodside

    // work : 2013-12-19 Registry Services, LLC
    work

    // works : 2013-11-14 Binky Moon, LLC
    works

    // world : 2014-06-12 Binky Moon, LLC
    world

    // wow : 2015-10-08 Amazon Registry Services, Inc.
    wow

    // wtc : 2013-12-19 World Trade Centers Association, Inc.
    wtc

    // wtf : 2014-03-06 Binky Moon, LLC
    wtf

    // xbox : 2014-12-18 Microsoft Corporation
    xbox

    // xerox : 2014-10-24 Xerox DNHC LLC
    xerox

    // xfinity : 2015-07-09 Comcast IP Holdings I, LLC
    xfinity

    // xihuan : 2015-01-08 Beijing Qihu Keji Co., Ltd.
    xihuan

    // xin : 2014-12-11 Elegant Leader Limited
    xin

    // xn--11b4c3d : 2015-01-15 VeriSign Sarl
    कॉम

    // xn--1ck2e1b : 2015-02-26 Amazon Registry Services, Inc.
    セール

    // xn--1qqw23a : 2014-01-09 Guangzhou YU Wei Information Technology Co., Ltd.
    佛山

    // xn--30rr7y : 2014-06-12 Excellent First Limited
    慈善

    // xn--3bst00m : 2013-09-13 Eagle Horizon Limited
    集团

    // xn--3ds443g : 2013-09-08 TLD REGISTRY LIMITED OY
    在线

    // xn--3pxu8k : 2015-01-15 VeriSign Sarl
    点看

    // xn--42c2d9a : 2015-01-15 VeriSign Sarl
    คอม

    // xn--45q11c : 2013-11-21 Zodiac Gemini Ltd
    八卦

    // xn--4gbrim : 2013-10-04 Helium TLDs Ltd
    موقع

    // xn--55qw42g : 2013-11-08 China Organizational Name Administration Center
    公益

    // xn--55qx5d : 2013-11-14 China Internet Network Information Center (CNNIC)
    公司

    // xn--5su34j936bgsg : 2015-09-03 Shangri‐La International Hotel Management Limited
    香格里拉

    // xn--5tzm5g : 2014-12-22 Global Website TLD Asia Limited
    网站

    // xn--6frz82g : 2013-09-23 Identity Digital Limited
    移动

    // xn--6qq986b3xl : 2013-09-13 Tycoon Treasure Limited
    我爱你

    // xn--80adxhks : 2013-12-19 Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
    москва

    // xn--80aqecdr1a : 2015-10-21 Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
    католик

    // xn--80asehdb : 2013-07-14 CORE Association
    онлайн

    // xn--80aswg : 2013-07-14 CORE Association
    сайт

    // xn--8y0a063a : 2015-03-26 China United Network Communications Corporation Limited
    联通

    // xn--9dbq2a : 2015-01-15 VeriSign Sarl
    קום

    // xn--9et52u : 2014-06-12 RISE VICTORY LIMITED
    时尚

    // xn--9krt00a : 2015-03-12 Sina Corporation
    微博

    // xn--b4w605ferd : 2014-08-07 Temasek Holdings (Private) Limited
    淡马锡

    // xn--bck1b9a5dre4c : 2015-02-26 Amazon Registry Services, Inc.
    ファッション

    // xn--c1avg : 2013-11-14 Public Interest Registry
    орг

    // xn--c2br7g : 2015-01-15 VeriSign Sarl
    नेट

    // xn--cck2b3b : 2015-02-26 Amazon Registry Services, Inc.
    ストア

    // xn--cckwcxetd : 2019-12-19 Amazon Registry Services, Inc.
    アマゾン

    // xn--cg4bki : 2013-09-27 SAMSUNG SDS CO., LTD
    삼성

    // xn--czr694b : 2014-01-16 Internet DotTrademark Organisation Limited
    商标

    // xn--czrs0t : 2013-12-19 Binky Moon, LLC
    商店

    // xn--czru2d : 2013-11-21 Zodiac Aquarius Limited
    商城

    // xn--d1acj3b : 2013-11-20 The Foundation for Network Initiatives “The Smart Internet”
    дети

    // xn--eckvdtc9d : 2014-12-18 Amazon Registry Services, Inc.
    ポイント

    // xn--efvy88h : 2014-08-22 Guangzhou YU Wei Information Technology Co., Ltd.
    新闻

    // xn--fct429k : 2015-04-09 Amazon Registry Services, Inc.
    家電

    // xn--fhbei : 2015-01-15 VeriSign Sarl
    كوم

    // xn--fiq228c5hs : 2013-09-08 TLD REGISTRY LIMITED OY
    中文网

    // xn--fiq64b : 2013-10-14 CITIC Group Corporation
    中信

    // xn--fjq720a : 2014-05-22 Binky Moon, LLC
    娱乐

    // xn--flw351e : 2014-07-31 Charleston Road Registry Inc.
    谷歌

    // xn--fzys8d69uvgm : 2015-05-14 PCCW Enterprises Limited
    電訊盈科

    // xn--g2xx48c : 2015-01-30 Nawang Heli(Xiamen) Network Service Co., LTD.
    购物

    // xn--gckr3f0f : 2015-02-26 Amazon Registry Services, Inc.
    クラウド

    // xn--gk3at1e : 2015-10-08 Amazon Registry Services, Inc.
    通販

    // xn--hxt814e : 2014-05-15 Zodiac Taurus Limited
    网店

    // xn--i1b6b1a6a2e : 2013-11-14 Public Interest Registry
    संगठन

    // xn--imr513n : 2014-12-11 Internet DotTrademark Organisation Limited
    餐厅

    // xn--io0a7i : 2013-11-14 China Internet Network Information Center (CNNIC)
    网络

    // xn--j1aef : 2015-01-15 VeriSign Sarl
    ком

    // xn--jlq480n2rg : 2019-12-19 Amazon Registry Services, Inc.
    亚马逊

    // xn--jvr189m : 2015-02-26 Amazon Registry Services, Inc.
    食品

    // xn--kcrx77d1x4a : 2014-11-07 Koninklijke Philips N.V.
    飞利浦

    // xn--kput3i : 2014-02-13 Beijing RITT-Net Technology Development Co., Ltd
    手机

    // xn--mgba3a3ejt : 2014-11-20 Aramco Services Company
    ارامكو

    // xn--mgba7c0bbn0a : 2015-05-14 Crescent Holding GmbH
    العليان

    // xn--mgbaakc7dvf : 2015-09-03 Emirates Telecommunications Corporation (trading as Etisalat)
    اتصالات

    // xn--mgbab2bd : 2013-10-31 CORE Association
    بازار

    // xn--mgbca7dzdo : 2015-07-30 Abu Dhabi Systems and Information Centre
    ابوظبي

    // xn--mgbi4ecexp : 2015-10-21 Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
    كاثوليك

    // xn--mgbt3dhd : 2014-09-04 Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
    همراه

    // xn--mk1bu44c : 2015-01-15 VeriSign Sarl
    닷컴

    // xn--mxtq1m : 2014-03-06 Net-Chinese Co., Ltd.
    政府

    // xn--ngbc5azd : 2013-07-13 International Domain Registry Pty. Ltd.
    شبكة

    // xn--ngbe9e0a : 2014-12-04 Kuwait Finance House
    بيتك

    // xn--ngbrx : 2015-11-12 League of Arab States
    عرب

    // xn--nqv7f : 2013-11-14 Public Interest Registry
    机构

    // xn--nqv7fs00ema : 2013-11-14 Public Interest Registry
    组织机构

    // xn--nyqy26a : 2014-11-07 Stable Tone Limited
    健康

    // xn--otu796d : 2017-08-06 Jiang Yu Liang Cai Technology Company Limited
    招聘

    // xn--p1acf : 2013-12-12 Rusnames Limited
    рус

    // xn--pssy2u : 2015-01-15 VeriSign Sarl
    大拿

    // xn--q9jyb4c : 2013-09-17 Charleston Road Registry Inc.
    みんな

    // xn--qcka1pmc : 2014-07-31 Charleston Road Registry Inc.
    グーグル

    // xn--rhqv96g : 2013-09-11 Stable Tone Limited
    世界

    // xn--rovu88b : 2015-02-26 Amazon Registry Services, Inc.
    書籍

    // xn--ses554g : 2014-01-16 KNET Co., Ltd.
    网址

    // xn--t60b56a : 2015-01-15 VeriSign Sarl
    닷넷

    // xn--tckwe : 2015-01-15 VeriSign Sarl
    コム

    // xn--tiq49xqyj : 2015-10-21 Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
    天主教

    // xn--unup4y : 2013-07-14 Binky Moon, LLC
    游戏

    // xn--vermgensberater-ctb : 2014-06-23 Deutsche Vermögensberatung Aktiengesellschaft DVAG
    vermögensberater

    // xn--vermgensberatung-pwb : 2014-06-23 Deutsche Vermögensberatung Aktiengesellschaft DVAG
    vermögensberatung

    // xn--vhquv : 2013-08-27 Binky Moon, LLC
    企业

    // xn--vuq861b : 2014-10-16 Beijing Tele-info Network Technology Co., Ltd.
    信息

    // xn--w4r85el8fhu5dnra : 2015-04-30 Kerry Trading Co. Limited
    嘉里大酒店

    // xn--w4rs40l : 2015-07-30 Kerry Trading Co. Limited
    嘉里

    // xn--xhq521b : 2013-11-14 Guangzhou YU Wei Information Technology Co., Ltd.
    广东

    // xn--zfr164b : 2013-11-08 China Organizational Name Administration Center
    政务

    // xyz : 2013-12-05 XYZ.COM LLC
    xyz

    // yachts : 2014-01-09 XYZ.COM LLC
    yachts

    // yahoo : 2015-04-02 Oath Inc.
    yahoo

    // yamaxun : 2014-12-18 Amazon Registry Services, Inc.
    yamaxun

    // yandex : 2014-04-10 Yandex Europe B.V.
    yandex

    // yodobashi : 2014-11-20 YODOBASHI CAMERA CO.,LTD.
    yodobashi

    // yoga : 2014-05-29 Registry Services, LLC
    yoga

    // yokohama : 2013-12-12 GMO Registry, Inc.
    yokohama

    // you : 2015-04-09 Amazon Registry Services, Inc.
    you

    // youtube : 2014-05-01 Charleston Road Registry Inc.
    youtube

    // yun : 2015-01-08 Beijing Qihu Keji Co., Ltd.
    yun

    // zappos : 2015-06-25 Amazon Registry Services, Inc.
    zappos

    // zara : 2014-11-07 Industria de Diseño Textil, S.A. (INDITEX, S.A.)
    zara

    // zero : 2014-12-18 Amazon Registry Services, Inc.
    zero

    // zip : 2014-05-08 Charleston Road Registry Inc.
    zip

    // zone : 2013-11-14 Binky Moon, LLC
    zone

    // zuerich : 2014-11-07 Kanton Zürich (Canton of Zurich)
    zuerich


    // ===END ICANN DOMAINS===
    // ===BEGIN PRIVATE DOMAINS===
    // (Note: these are in alphabetical order by company name)

    // 1GB LLC : https://www.1gb.ua/
    // Submitted by 1GB LLC <noc@1gb.com.ua>
    cc.ua
    inf.ua
    ltd.ua

    // 611coin : https://611project.org/
    611.to

    // Aaron Marais' Gitlab pages: https://lab.aaronleem.co.za
    // Submitted by Aaron Marais <its_me@aaronleem.co.za>
    graphox.us

    // accesso Technology Group, plc. : https://accesso.com/
    // Submitted by accesso Team <accessoecommerce@accesso.com>
    *.devcdnaccesso.com

    // Acorn Labs : https://acorn.io
    // Submitted by Craig Jellick <domains@acorn.io>
    *.on-acorn.io

    // ActiveTrail: https://www.activetrail.biz/
    // Submitted by Ofer Kalaora <postmaster@activetrail.com>
    activetrail.biz

    // Adobe : https://www.adobe.com/
    // Submitted by Ian Boston <boston@adobe.com> and Lars Trieloff <trieloff@adobe.com>
    adobeaemcloud.com
    *.dev.adobeaemcloud.com
    hlx.live
    adobeaemcloud.net
    hlx.page
    hlx3.page

    // Agnat sp. z o.o. : https://domena.pl
    // Submitted by Przemyslaw Plewa <it-admin@domena.pl>
    beep.pl

    // Airkit : https://www.airkit.com/
    // Submitted by Grant Cooksey <security@airkit.com>
    airkitapps.com
    airkitapps-au.com
    airkitapps.eu

    // Aiven: https://aiven.io/
    // Submitted by Etienne Stalmans <security@aiven.io>
    aivencloud.com

    // alboto.ca : http://alboto.ca
    // Submitted by Anton Avramov <avramov@alboto.ca>
    barsy.ca

    // Alces Software Ltd : http://alces-software.com
    // Submitted by Mark J. Titorenko <mark.titorenko@alces-software.com>
    *.compute.estate
    *.alces.network

    // all-inkl.com : https://all-inkl.com
    // Submitted by Werner Kaltofen <wk@all-inkl.com>
    kasserver.com

    // Altervista: https://www.altervista.org
    // Submitted by Carlo Cannas <tech_staff@altervista.it>
    altervista.org

    // alwaysdata : https://www.alwaysdata.com
    // Submitted by Cyril <admin@alwaysdata.com>
    alwaysdata.net

    // Amaze Software : https://amaze.co
    // Submitted by Domain Admin <domainadmin@amaze.co>
    myamaze.net

    // Amazon : https://www.amazon.com/
    // Submitted by AWS Security <psl-maintainers@amazon.com>
    // Subsections of Amazon/subsidiaries will appear until "concludes" tag

    // Amazon CloudFront
    // Submitted by Donavan Miller <donavanm@amazon.com>
    // Reference: 54144616-fd49-4435-8535-19c6a601bdb3
    cloudfront.net

    // Amazon EC2
    // Submitted by Luke Wells <psl-maintainers@amazon.com>
    // Reference: 4c38fa71-58ac-4768-99e5-689c1767e537
    *.compute.amazonaws.com
    *.compute-1.amazonaws.com
    *.compute.amazonaws.com.cn
    us-east-1.amazonaws.com

    // Amazon S3
    // Submitted by Luke Wells <psl-maintainers@amazon.com>
    // Reference: d068bd97-f0a9-4838-a6d8-954b622ef4ae
    s3.cn-north-1.amazonaws.com.cn
    s3.dualstack.ap-northeast-1.amazonaws.com
    s3.dualstack.ap-northeast-2.amazonaws.com
    s3.ap-northeast-2.amazonaws.com
    s3-website.ap-northeast-2.amazonaws.com
    s3.dualstack.ap-south-1.amazonaws.com
    s3.ap-south-1.amazonaws.com
    s3-website.ap-south-1.amazonaws.com
    s3.dualstack.ap-southeast-1.amazonaws.com
    s3.dualstack.ap-southeast-2.amazonaws.com
    s3.dualstack.ca-central-1.amazonaws.com
    s3.ca-central-1.amazonaws.com
    s3-website.ca-central-1.amazonaws.com
    s3.dualstack.eu-central-1.amazonaws.com
    s3.eu-central-1.amazonaws.com
    s3-website.eu-central-1.amazonaws.com
    s3.dualstack.eu-west-1.amazonaws.com
    s3.dualstack.eu-west-2.amazonaws.com
    s3.eu-west-2.amazonaws.com
    s3-website.eu-west-2.amazonaws.com
    s3.dualstack.eu-west-3.amazonaws.com
    s3.eu-west-3.amazonaws.com
    s3-website.eu-west-3.amazonaws.com
    s3.amazonaws.com
    s3-ap-northeast-1.amazonaws.com
    s3-ap-northeast-2.amazonaws.com
    s3-ap-south-1.amazonaws.com
    s3-ap-southeast-1.amazonaws.com
    s3-ap-southeast-2.amazonaws.com
    s3-ca-central-1.amazonaws.com
    s3-eu-central-1.amazonaws.com
    s3-eu-west-1.amazonaws.com
    s3-eu-west-2.amazonaws.com
    s3-eu-west-3.amazonaws.com
    s3-external-1.amazonaws.com
    s3-fips-us-gov-west-1.amazonaws.com
    s3-sa-east-1.amazonaws.com
    s3-us-east-2.amazonaws.com
    s3-us-gov-west-1.amazonaws.com
    s3-us-west-1.amazonaws.com
    s3-us-west-2.amazonaws.com
    s3-website-ap-northeast-1.amazonaws.com
    s3-website-ap-southeast-1.amazonaws.com
    s3-website-ap-southeast-2.amazonaws.com
    s3-website-eu-west-1.amazonaws.com
    s3-website-sa-east-1.amazonaws.com
    s3-website-us-east-1.amazonaws.com
    s3-website-us-west-1.amazonaws.com
    s3-website-us-west-2.amazonaws.com
    s3.dualstack.sa-east-1.amazonaws.com
    s3.dualstack.us-east-1.amazonaws.com
    s3.dualstack.us-east-2.amazonaws.com
    s3.us-east-2.amazonaws.com
    s3-website.us-east-2.amazonaws.com

    // AWS Cloud9
    // Submitted by: AWS Security <psl-maintainers@amazon.com>
    // Reference: 2b6dfa9a-3a7f-4367-b2e7-0321e77c0d59
    vfs.cloud9.af-south-1.amazonaws.com
    webview-assets.cloud9.af-south-1.amazonaws.com
    vfs.cloud9.ap-east-1.amazonaws.com
    webview-assets.cloud9.ap-east-1.amazonaws.com
    vfs.cloud9.ap-northeast-1.amazonaws.com
    webview-assets.cloud9.ap-northeast-1.amazonaws.com
    vfs.cloud9.ap-northeast-2.amazonaws.com
    webview-assets.cloud9.ap-northeast-2.amazonaws.com
    vfs.cloud9.ap-northeast-3.amazonaws.com
    webview-assets.cloud9.ap-northeast-3.amazonaws.com
    vfs.cloud9.ap-south-1.amazonaws.com
    webview-assets.cloud9.ap-south-1.amazonaws.com
    vfs.cloud9.ap-southeast-1.amazonaws.com
    webview-assets.cloud9.ap-southeast-1.amazonaws.com
    vfs.cloud9.ap-southeast-2.amazonaws.com
    webview-assets.cloud9.ap-southeast-2.amazonaws.com
    vfs.cloud9.ca-central-1.amazonaws.com
    webview-assets.cloud9.ca-central-1.amazonaws.com
    vfs.cloud9.eu-central-1.amazonaws.com
    webview-assets.cloud9.eu-central-1.amazonaws.com
    vfs.cloud9.eu-north-1.amazonaws.com
    webview-assets.cloud9.eu-north-1.amazonaws.com
    vfs.cloud9.eu-south-1.amazonaws.com
    webview-assets.cloud9.eu-south-1.amazonaws.com
    vfs.cloud9.eu-west-1.amazonaws.com
    webview-assets.cloud9.eu-west-1.amazonaws.com
    vfs.cloud9.eu-west-2.amazonaws.com
    webview-assets.cloud9.eu-west-2.amazonaws.com
    vfs.cloud9.eu-west-3.amazonaws.com
    webview-assets.cloud9.eu-west-3.amazonaws.com
    vfs.cloud9.me-south-1.amazonaws.com
    webview-assets.cloud9.me-south-1.amazonaws.com
    vfs.cloud9.sa-east-1.amazonaws.com
    webview-assets.cloud9.sa-east-1.amazonaws.com
    vfs.cloud9.us-east-1.amazonaws.com
    webview-assets.cloud9.us-east-1.amazonaws.com
    vfs.cloud9.us-east-2.amazonaws.com
    webview-assets.cloud9.us-east-2.amazonaws.com
    vfs.cloud9.us-west-1.amazonaws.com
    webview-assets.cloud9.us-west-1.amazonaws.com
    vfs.cloud9.us-west-2.amazonaws.com
    webview-assets.cloud9.us-west-2.amazonaws.com

    // AWS Elastic Beanstalk
    // Submitted by Luke Wells <psl-maintainers@amazon.com>
    // Reference: aa202394-43a0-4857-b245-8db04549137e
    cn-north-1.eb.amazonaws.com.cn
    cn-northwest-1.eb.amazonaws.com.cn
    elasticbeanstalk.com
    ap-northeast-1.elasticbeanstalk.com
    ap-northeast-2.elasticbeanstalk.com
    ap-northeast-3.elasticbeanstalk.com
    ap-south-1.elasticbeanstalk.com
    ap-southeast-1.elasticbeanstalk.com
    ap-southeast-2.elasticbeanstalk.com
    ca-central-1.elasticbeanstalk.com
    eu-central-1.elasticbeanstalk.com
    eu-west-1.elasticbeanstalk.com
    eu-west-2.elasticbeanstalk.com
    eu-west-3.elasticbeanstalk.com
    sa-east-1.elasticbeanstalk.com
    us-east-1.elasticbeanstalk.com
    us-east-2.elasticbeanstalk.com
    us-gov-west-1.elasticbeanstalk.com
    us-west-1.elasticbeanstalk.com
    us-west-2.elasticbeanstalk.com

    // (AWS) Elastic Load Balancing
    // Submitted by Luke Wells <psl-maintainers@amazon.com>
    // Reference: 12a3d528-1bac-4433-a359-a395867ffed2
    *.elb.amazonaws.com.cn
    *.elb.amazonaws.com

    // AWS Global Accelerator
    // Submitted by Daniel Massaguer <psl-maintainers@amazon.com>
    // Reference: d916759d-a08b-4241-b536-4db887383a6a
    awsglobalaccelerator.com

    // eero
    // Submitted by Yue Kang <eero-dynamic-dns@amazon.com>
    // Reference: 264afe70-f62c-4c02-8ab9-b5281ed24461
    eero.online
    eero-stage.online

    // concludes Amazon

    // Amune : https://amune.org/
    // Submitted by Team Amune <cert@amune.org>
    t3l3p0rt.net
    tele.amune.org

    // Apigee : https://apigee.com/
    // Submitted by Apigee Security Team <security@apigee.com>
    apigee.io

    // Apphud : https://apphud.com
    // Submitted by Alexander Selivanov <alex@apphud.com>
    siiites.com

    // Appspace : https://www.appspace.com
    // Submitted by Appspace Security Team <security@appspace.com>
    appspacehosted.com
    appspaceusercontent.com

    // Appudo UG (haftungsbeschränkt) : https://www.appudo.com
    // Submitted by Alexander Hochbaum <admin@appudo.com>
    appudo.net

    // Aptible : https://www.aptible.com/
    // Submitted by Thomas Orozco <thomas@aptible.com>
    on-aptible.com

    // ASEINet : https://www.aseinet.com/
    // Submitted by Asei SEKIGUCHI <mail@aseinet.com>
    user.aseinet.ne.jp
    gv.vc
    d.gv.vc

    // Asociación Amigos de la Informática "Euskalamiga" : http://encounter.eus/
    // Submitted by Hector Martin <marcan@euskalencounter.org>
    user.party.eus

    // Association potager.org : https://potager.org/
    // Submitted by Lunar <jardiniers@potager.org>
    pimienta.org
    poivron.org
    potager.org
    sweetpepper.org

    // ASUSTOR Inc. : http://www.asustor.com
    // Submitted by Vincent Tseng <vincenttseng@asustor.com>
    myasustor.com

    // Atlassian : https://atlassian.com
    // Submitted by Sam Smyth <devloop@atlassian.com>
    cdn.prod.atlassian-dev.net

    // Authentick UG (haftungsbeschränkt) : https://authentick.net
    // Submitted by Lukas Reschke <lukas@authentick.net>
    translated.page

    // AVM : https://avm.de
    // Submitted by Andreas Weise <a.weise@avm.de>
    myfritz.net

    // AVStack Pte. Ltd. : https://avstack.io
    // Submitted by Jasper Hugo <jasper@avstack.io>
    onavstack.net

    // AW AdvisorWebsites.com Software Inc : https://advisorwebsites.com
    // Submitted by James Kennedy <domains@advisorwebsites.com>
    *.awdev.ca
    *.advisor.ws

    // AZ.pl sp. z.o.o: https://az.pl
    // Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
    ecommerce-shop.pl

    // b-data GmbH : https://www.b-data.io
    // Submitted by Olivier Benz <olivier.benz@b-data.ch>
    b-data.io

    // backplane : https://www.backplane.io
    // Submitted by Anthony Voutas <anthony@backplane.io>
    backplaneapp.io

    // Balena : https://www.balena.io
    // Submitted by Petros Angelatos <petrosagg@balena.io>
    balena-devices.com

    // University of Banja Luka : https://unibl.org
    // Domains for Republic of Srpska administrative entity.
    // Submitted by Marko Ivanovic <kormang@hotmail.rs>
    rs.ba

    // Banzai Cloud
    // Submitted by Janos Matyas <info@banzaicloud.com>
    *.banzai.cloud
    app.banzaicloud.io
    *.backyards.banzaicloud.io

    // BASE, Inc. : https://binc.jp
    // Submitted by Yuya NAGASAWA <public-suffix-list@binc.jp>
    base.ec
    official.ec
    buyshop.jp
    fashionstore.jp
    handcrafted.jp
    kawaiishop.jp
    supersale.jp
    theshop.jp
    shopselect.net
    base.shop

    // BeagleBoard.org Foundation : https://beagleboard.org
    // Submitted by Jason Kridner <jkridner@beagleboard.org>
    beagleboard.io

    // Beget Ltd
    // Submitted by Lev Nekrasov <lnekrasov@beget.com>
    *.beget.app

    // BetaInABox
    // Submitted by Adrian <adrian@betainabox.com>
    betainabox.com

    // BinaryLane : http://www.binarylane.com
    // Submitted by Nathan O'Sullivan <nathan@mammoth.com.au>
    bnr.la

    // Bitbucket : http://bitbucket.org
    // Submitted by Andy Ortlieb <aortlieb@atlassian.com>
    bitbucket.io

    // Blackbaud, Inc. : https://www.blackbaud.com
    // Submitted by Paul Crowder <paul.crowder@blackbaud.com>
    blackbaudcdn.net

    // Blatech : http://www.blatech.net
    // Submitted by Luke Bratch <luke@bratch.co.uk>
    of.je

    // Blue Bite, LLC : https://bluebite.com
    // Submitted by Joshua Weiss <admin.engineering@bluebite.com>
    bluebite.io

    // Boomla : https://boomla.com
    // Submitted by Tibor Halter <thalter@boomla.com>
    boomla.net

    // Boutir : https://www.boutir.com
    // Submitted by Eric Ng Ka Ka <ngkaka@boutir.com>
    boutir.com

    // Boxfuse : https://boxfuse.com
    // Submitted by Axel Fontaine <axel@boxfuse.com>
    boxfuse.io

    // bplaced : https://www.bplaced.net/
    // Submitted by Miroslav Bozic <security@bplaced.net>
    square7.ch
    bplaced.com
    bplaced.de
    square7.de
    bplaced.net
    square7.net

    // Brendly : https://brendly.rs
    // Submitted by Dusan Radovanovic <dusan.radovanovic@brendly.rs>
    shop.brendly.rs

    // BrowserSafetyMark
    // Submitted by Dave Tharp <browsersafetymark.io@quicinc.com>
    browsersafetymark.io

    // Bytemark Hosting : https://www.bytemark.co.uk
    // Submitted by Paul Cammish <paul.cammish@bytemark.co.uk>
    uk0.bigv.io
    dh.bytemark.co.uk
    vm.bytemark.co.uk

    // Caf.js Labs LLC : https://www.cafjs.com
    // Submitted by Antonio Lain <antlai@cafjs.com>
    cafjs.com

    // callidomus : https://www.callidomus.com/
    // Submitted by Marcus Popp <admin@callidomus.com>
    mycd.eu

    // Carrd : https://carrd.co
    // Submitted by AJ <aj@carrd.co>
    drr.ac
    uwu.ai
    carrd.co
    crd.co
    ju.mp

    // CentralNic : http://www.centralnic.com/names/domains
    // Submitted by registry <gavin.brown@centralnic.com>
    ae.org
    br.com
    cn.com
    com.de
    com.se
    de.com
    eu.com
    gb.net
    hu.net
    jp.net
    jpn.com
    mex.com
    ru.com
    sa.com
    se.net
    uk.com
    uk.net
    us.com
    za.bz
    za.com

    // No longer operated by CentralNic, these entries should be adopted and/or removed by current operators
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    ar.com
    hu.com
    kr.com
    no.com
    qc.com
    uy.com

    // Africa.com Web Solutions Ltd : https://registry.africa.com
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    africa.com

    // iDOT Services Limited : http://www.domain.gr.com
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    gr.com

    // Radix FZC : http://domains.in.net
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    in.net
    web.in

    // US REGISTRY LLC : http://us.org
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    us.org

    // co.com Registry, LLC : https://registry.co.com
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    co.com

    // Roar Domains LLC : https://roar.basketball/
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    aus.basketball
    nz.basketball

    // BRS Media : https://brsmedia.com/
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    radio.am
    radio.fm

    // c.la : http://www.c.la/
    c.la

    // certmgr.org : https://certmgr.org
    // Submitted by B. Blechschmidt <hostmaster@certmgr.org>
    certmgr.org

    // Cityhost LLC  : https://cityhost.ua
    // Submitted by Maksym Rivtin <support@cityhost.net.ua>
    cx.ua

    // Civilized Discourse Construction Kit, Inc. : https://www.discourse.org/
    // Submitted by Rishabh Nambiar & Michael Brown <team@discourse.org>
    discourse.group
    discourse.team

    // Clever Cloud : https://www.clever-cloud.com/
    // Submitted by Quentin Adam <noc@clever-cloud.com>
    cleverapps.io

    // Clerk : https://www.clerk.dev
    // Submitted by Colin Sidoti <systems@clerk.dev>
    clerk.app
    clerkstage.app
    *.lcl.dev
    *.lclstage.dev
    *.stg.dev
    *.stgstage.dev

    // ClickRising : https://clickrising.com/
    // Submitted by Umut Gumeli <infrastructure-publicsuffixlist@clickrising.com>
    clickrising.net

    // Cloud66 : https://www.cloud66.com/
    // Submitted by Khash Sajadi <khash@cloud66.com>
    c66.me
    cloud66.ws
    cloud66.zone

    // CloudAccess.net : https://www.cloudaccess.net/
    // Submitted by Pawel Panek <noc@cloudaccess.net>
    jdevcloud.com
    wpdevcloud.com
    cloudaccess.host
    freesite.host
    cloudaccess.net

    // cloudControl : https://www.cloudcontrol.com/
    // Submitted by Tobias Wilken <tw@cloudcontrol.com>
    cloudcontrolled.com
    cloudcontrolapp.com

    // Cloudera, Inc. : https://www.cloudera.com/
    // Submitted by Kedarnath Waikar <security@cloudera.com>
    *.cloudera.site

    // Cloudflare, Inc. : https://www.cloudflare.com/
    // Submitted by Cloudflare Team <publicsuffixlist@cloudflare.com>
    cf-ipfs.com
    cloudflare-ipfs.com
    trycloudflare.com
    pages.dev
    r2.dev
    workers.dev

    // Clovyr : https://clovyr.io
    // Submitted by Patrick Nielsen <patrick@clovyr.io>
    wnext.app

    // co.ca : http://registry.co.ca/
    co.ca

    // Co & Co : https://co-co.nl/
    // Submitted by Govert Versluis <govert@co-co.nl>
    *.otap.co

    // i-registry s.r.o. : http://www.i-registry.cz/
    // Submitted by Martin Semrad <semrad@i-registry.cz>
    co.cz

    // CDN77.com : http://www.cdn77.com
    // Submitted by Jan Krpes <jan.krpes@cdn77.com>
    c.cdn77.org
    cdn77-ssl.net
    r.cdn77.net
    rsc.cdn77.org
    ssl.origin.cdn77-secure.org

    // Cloud DNS Ltd : http://www.cloudns.net
    // Submitted by Aleksander Hristov <noc@cloudns.net>
    cloudns.asia
    cloudns.biz
    cloudns.club
    cloudns.cc
    cloudns.eu
    cloudns.in
    cloudns.info
    cloudns.org
    cloudns.pro
    cloudns.pw
    cloudns.us

    // CNPY : https://cnpy.gdn
    // Submitted by Angelo Gladding <angelo@lahacker.net>
    cnpy.gdn

    // Codeberg e. V. : https://codeberg.org
    // Submitted by Moritz Marquardt <git@momar.de>
    codeberg.page

    // CoDNS B.V.
    co.nl
    co.no

    // Combell.com : https://www.combell.com
    // Submitted by Thomas Wouters <thomas.wouters@combellgroup.com>
    webhosting.be
    hosting-cluster.nl

    // Coordination Center for TLD RU and XN--P1AI : https://cctld.ru/en/domains/domens_ru/reserved/
    // Submitted by George Georgievsky <gug@cctld.ru>
    ac.ru
    edu.ru
    gov.ru
    int.ru
    mil.ru
    test.ru

    // COSIMO GmbH : http://www.cosimo.de
    // Submitted by Rene Marticke <rmarticke@cosimo.de>
    dyn.cosidns.de
    dynamisches-dns.de
    dnsupdater.de
    internet-dns.de
    l-o-g-i-n.de
    dynamic-dns.info
    feste-ip.net
    knx-server.net
    static-access.net

    // Craynic, s.r.o. : http://www.craynic.com/
    // Submitted by Ales Krajnik <ales.krajnik@craynic.com>
    realm.cz

    // Cryptonomic : https://cryptonomic.net/
    // Submitted by Andrew Cady <public-suffix-list@cryptonomic.net>
    *.cryptonomic.net

    // Cupcake : https://cupcake.io/
    // Submitted by Jonathan Rudenberg <jonathan@cupcake.io>
    cupcake.is

    // Curv UG : https://curv-labs.de/
    // Submitted by Marvin Wiesner <Marvin@curv-labs.de>
    curv.dev

    // Customer OCI - Oracle Dyn https://cloud.oracle.com/home https://dyn.com/dns/
    // Submitted by Gregory Drake <support@dyn.com>
    // Note: This is intended to also include customer-oci.com due to wildcards implicitly including the current label
    *.customer-oci.com
    *.oci.customer-oci.com
    *.ocp.customer-oci.com
    *.ocs.customer-oci.com

    // cyon GmbH : https://www.cyon.ch/
    // Submitted by Dominic Luechinger <dol@cyon.ch>
    cyon.link
    cyon.site

    // Danger Science Group: https://dangerscience.com/
    // Submitted by Skylar MacDonald <skylar@dangerscience.com>
    fnwk.site
    folionetwork.site
    platform0.app

    // Daplie, Inc : https://daplie.com
    // Submitted by AJ ONeal <aj@daplie.com>
    daplie.me
    localhost.daplie.me

    // Datto, Inc. : https://www.datto.com/
    // Submitted by Philipp Heckel <ph@datto.com>
    dattolocal.com
    dattorelay.com
    dattoweb.com
    mydatto.com
    dattolocal.net
    mydatto.net

    // Dansk.net : http://www.dansk.net/
    // Submitted by Anani Voule <digital@digital.co.dk>
    biz.dk
    co.dk
    firm.dk
    reg.dk
    store.dk

    // dappnode.io : https://dappnode.io/
    // Submitted by Abel Boldu / DAppNode Team <community@dappnode.io>
    dyndns.dappnode.io

    // dapps.earth : https://dapps.earth/
    // Submitted by Daniil Burdakov <icqkill@gmail.com>
    *.dapps.earth
    *.bzz.dapps.earth

    // Dark, Inc. : https://darklang.com
    // Submitted by Paul Biggar <ops@darklang.com>
    builtwithdark.com

    // DataDetect, LLC. : https://datadetect.com
    // Submitted by Andrew Banchich <abanchich@sceven.com>
    demo.datadetect.com
    instance.datadetect.com

    // Datawire, Inc : https://www.datawire.io
    // Submitted by Richard Li <secalert@datawire.io>
    edgestack.me

    // DDNS5 : https://ddns5.com
    // Submitted by Cameron Elliott <cameron@cameronelliott.com>
    ddns5.com

    // Debian : https://www.debian.org/
    // Submitted by Peter Palfrader / Debian Sysadmin Team <dsa-publicsuffixlist@debian.org>
    debian.net

    // Deno Land Inc : https://deno.com/
    // Submitted by Luca Casonato <hostmaster@deno.com>
    deno.dev
    deno-staging.dev

    // deSEC : https://desec.io/
    // Submitted by Peter Thomassen <peter@desec.io>
    dedyn.io

    // Deta: https://www.deta.sh/
    // Submitted by Aavash Shrestha <aavash@deta.sh>
    deta.app
    deta.dev

    // Diher Solutions : https://diher.solutions
    // Submitted by Didi Hermawan <mail@diher.solutions>
    *.rss.my.id
    *.diher.solutions

    // Discord Inc : https://discord.com
    // Submitted by Sahn Lam <slam@discordapp.com>
    discordsays.com
    discordsez.com

    // DNS Africa Ltd https://dns.business
    // Submitted by Calvin Browne <calvin@dns.business>
    jozi.biz

    // DNShome : https://www.dnshome.de/
    // Submitted by Norbert Auler <mail@dnshome.de>
    dnshome.de

    // DotArai : https://www.dotarai.com/
    // Submitted by Atsadawat Netcharadsang <atsadawat@dotarai.co.th>
    online.th
    shop.th

    // DrayTek Corp. : https://www.draytek.com/
    // Submitted by Paul Fang <mis@draytek.com>
    drayddns.com

    // DreamCommerce : https://shoper.pl/
    // Submitted by Konrad Kotarba <konrad.kotarba@dreamcommerce.com>
    shoparena.pl

    // DreamHost : http://www.dreamhost.com/
    // Submitted by Andrew Farmer <andrew.farmer@dreamhost.com>
    dreamhosters.com

    // Drobo : http://www.drobo.com/
    // Submitted by Ricardo Padilha <rpadilha@drobo.com>
    mydrobo.com

    // Drud Holdings, LLC. : https://www.drud.com/
    // Submitted by Kevin Bridges <kevin@drud.com>
    drud.io
    drud.us

    // DuckDNS : http://www.duckdns.org/
    // Submitted by Richard Harper <richard@duckdns.org>
    duckdns.org

    // Bip : https://bip.sh
    // Submitted by Joel Kennedy <joel@bip.sh>
    bip.sh

    // bitbridge.net : Submitted by Craig Welch, abeliidev@gmail.com
    bitbridge.net

    // dy.fi : http://dy.fi/
    // Submitted by Heikki Hannikainen <hessu@hes.iki.fi>
    dy.fi
    tunk.org

    // DynDNS.com : http://www.dyndns.com/services/dns/dyndns/
    dyndns-at-home.com
    dyndns-at-work.com
    dyndns-blog.com
    dyndns-free.com
    dyndns-home.com
    dyndns-ip.com
    dyndns-mail.com
    dyndns-office.com
    dyndns-pics.com
    dyndns-remote.com
    dyndns-server.com
    dyndns-web.com
    dyndns-wiki.com
    dyndns-work.com
    dyndns.biz
    dyndns.info
    dyndns.org
    dyndns.tv
    at-band-camp.net
    ath.cx
    barrel-of-knowledge.info
    barrell-of-knowledge.info
    better-than.tv
    blogdns.com
    blogdns.net
    blogdns.org
    blogsite.org
    boldlygoingnowhere.org
    broke-it.net
    buyshouses.net
    cechire.com
    dnsalias.com
    dnsalias.net
    dnsalias.org
    dnsdojo.com
    dnsdojo.net
    dnsdojo.org
    does-it.net
    doesntexist.com
    doesntexist.org
    dontexist.com
    dontexist.net
    dontexist.org
    doomdns.com
    doomdns.org
    dvrdns.org
    dyn-o-saur.com
    dynalias.com
    dynalias.net
    dynalias.org
    dynathome.net
    dyndns.ws
    endofinternet.net
    endofinternet.org
    endoftheinternet.org
    est-a-la-maison.com
    est-a-la-masion.com
    est-le-patron.com
    est-mon-blogueur.com
    for-better.biz
    for-more.biz
    for-our.info
    for-some.biz
    for-the.biz
    forgot.her.name
    forgot.his.name
    from-ak.com
    from-al.com
    from-ar.com
    from-az.net
    from-ca.com
    from-co.net
    from-ct.com
    from-dc.com
    from-de.com
    from-fl.com
    from-ga.com
    from-hi.com
    from-ia.com
    from-id.com
    from-il.com
    from-in.com
    from-ks.com
    from-ky.com
    from-la.net
    from-ma.com
    from-md.com
    from-me.org
    from-mi.com
    from-mn.com
    from-mo.com
    from-ms.com
    from-mt.com
    from-nc.com
    from-nd.com
    from-ne.com
    from-nh.com
    from-nj.com
    from-nm.com
    from-nv.com
    from-ny.net
    from-oh.com
    from-ok.com
    from-or.com
    from-pa.com
    from-pr.com
    from-ri.com
    from-sc.com
    from-sd.com
    from-tn.com
    from-tx.com
    from-ut.com
    from-va.com
    from-vt.com
    from-wa.com
    from-wi.com
    from-wv.com
    from-wy.com
    ftpaccess.cc
    fuettertdasnetz.de
    game-host.org
    game-server.cc
    getmyip.com
    gets-it.net
    go.dyndns.org
    gotdns.com
    gotdns.org
    groks-the.info
    groks-this.info
    ham-radio-op.net
    here-for-more.info
    hobby-site.com
    hobby-site.org
    home.dyndns.org
    homedns.org
    homeftp.net
    homeftp.org
    homeip.net
    homelinux.com
    homelinux.net
    homelinux.org
    homeunix.com
    homeunix.net
    homeunix.org
    iamallama.com
    in-the-band.net
    is-a-anarchist.com
    is-a-blogger.com
    is-a-bookkeeper.com
    is-a-bruinsfan.org
    is-a-bulls-fan.com
    is-a-candidate.org
    is-a-caterer.com
    is-a-celticsfan.org
    is-a-chef.com
    is-a-chef.net
    is-a-chef.org
    is-a-conservative.com
    is-a-cpa.com
    is-a-cubicle-slave.com
    is-a-democrat.com
    is-a-designer.com
    is-a-doctor.com
    is-a-financialadvisor.com
    is-a-geek.com
    is-a-geek.net
    is-a-geek.org
    is-a-green.com
    is-a-guru.com
    is-a-hard-worker.com
    is-a-hunter.com
    is-a-knight.org
    is-a-landscaper.com
    is-a-lawyer.com
    is-a-liberal.com
    is-a-libertarian.com
    is-a-linux-user.org
    is-a-llama.com
    is-a-musician.com
    is-a-nascarfan.com
    is-a-nurse.com
    is-a-painter.com
    is-a-patsfan.org
    is-a-personaltrainer.com
    is-a-photographer.com
    is-a-player.com
    is-a-republican.com
    is-a-rockstar.com
    is-a-socialist.com
    is-a-soxfan.org
    is-a-student.com
    is-a-teacher.com
    is-a-techie.com
    is-a-therapist.com
    is-an-accountant.com
    is-an-actor.com
    is-an-actress.com
    is-an-anarchist.com
    is-an-artist.com
    is-an-engineer.com
    is-an-entertainer.com
    is-by.us
    is-certified.com
    is-found.org
    is-gone.com
    is-into-anime.com
    is-into-cars.com
    is-into-cartoons.com
    is-into-games.com
    is-leet.com
    is-lost.org
    is-not-certified.com
    is-saved.org
    is-slick.com
    is-uberleet.com
    is-very-bad.org
    is-very-evil.org
    is-very-good.org
    is-very-nice.org
    is-very-sweet.org
    is-with-theband.com
    isa-geek.com
    isa-geek.net
    isa-geek.org
    isa-hockeynut.com
    issmarterthanyou.com
    isteingeek.de
    istmein.de
    kicks-ass.net
    kicks-ass.org
    knowsitall.info
    land-4-sale.us
    lebtimnetz.de
    leitungsen.de
    likes-pie.com
    likescandy.com
    merseine.nu
    mine.nu
    misconfused.org
    mypets.ws
    myphotos.cc
    neat-url.com
    office-on-the.net
    on-the-web.tv
    podzone.net
    podzone.org
    readmyblog.org
    saves-the-whales.com
    scrapper-site.net
    scrapping.cc
    selfip.biz
    selfip.com
    selfip.info
    selfip.net
    selfip.org
    sells-for-less.com
    sells-for-u.com
    sells-it.net
    sellsyourhome.org
    servebbs.com
    servebbs.net
    servebbs.org
    serveftp.net
    serveftp.org
    servegame.org
    shacknet.nu
    simple-url.com
    space-to-rent.com
    stuff-4-sale.org
    stuff-4-sale.us
    teaches-yoga.com
    thruhere.net
    traeumtgerade.de
    webhop.biz
    webhop.info
    webhop.net
    webhop.org
    worse-than.tv
    writesthisblog.com

    // ddnss.de : https://www.ddnss.de/
    // Submitted by Robert Niedziela <webmaster@ddnss.de>
    ddnss.de
    dyn.ddnss.de
    dyndns.ddnss.de
    dyndns1.de
    dyn-ip24.de
    home-webserver.de
    dyn.home-webserver.de
    myhome-server.de
    ddnss.org

    // Definima : http://www.definima.com/
    // Submitted by Maxence Bitterli <maxence@definima.com>
    definima.net
    definima.io

    // DigitalOcean App Platform : https://www.digitalocean.com/products/app-platform/
    // Submitted by Braxton Huggins <psl-maintainers@digitalocean.com>
    ondigitalocean.app

    // DigitalOcean Spaces : https://www.digitalocean.com/products/spaces/
    // Submitted by Robin H. Johnson <psl-maintainers@digitalocean.com>
    *.digitaloceanspaces.com

    // dnstrace.pro : https://dnstrace.pro/
    // Submitted by Chris Partridge <chris@partridge.tech>
    bci.dnstrace.pro

    // Dynu.com : https://www.dynu.com/
    // Submitted by Sue Ye <sue@dynu.com>
    ddnsfree.com
    ddnsgeek.com
    giize.com
    gleeze.com
    kozow.com
    loseyourip.com
    ooguy.com
    theworkpc.com
    casacam.net
    dynu.net
    accesscam.org
    camdvr.org
    freeddns.org
    mywire.org
    webredirect.org
    myddns.rocks
    blogsite.xyz

    // dynv6 : https://dynv6.com
    // Submitted by Dominik Menke <dom@digineo.de>
    dynv6.net

    // E4YOU spol. s.r.o. : https://e4you.cz/
    // Submitted by Vladimir Dudr <info@e4you.cz>
    e4.cz

    // Easypanel : https://easypanel.io
    // Submitted by Andrei Canta <andrei@easypanel.io>
    easypanel.app
    easypanel.host

    // Elementor : Elementor Ltd.
    // Submitted by Anton Barkan <antonb@elementor.com>
    elementor.cloud
    elementor.cool

    // En root‽ : https://en-root.org
    // Submitted by Emmanuel Raviart <emmanuel@raviart.com>
    en-root.fr

    // Enalean SAS: https://www.enalean.com
    // Submitted by Thomas Cottier <thomas.cottier@enalean.com>
    mytuleap.com
    tuleap-partners.com

    // Encoretivity AB: https://encore.dev
    // Submitted by André Eriksson <andre@encore.dev>
    encr.app
    encoreapi.com

    // ECG Robotics, Inc: https://ecgrobotics.org
    // Submitted by <frc1533@ecgrobotics.org>
    onred.one
    staging.onred.one

    // encoway GmbH : https://www.encoway.de
    // Submitted by Marcel Daus <cloudops@encoway.de>
    eu.encoway.cloud

    // EU.org https://eu.org/
    // Submitted by Pierre Beyssac <hostmaster@eu.org>
    eu.org
    al.eu.org
    asso.eu.org
    at.eu.org
    au.eu.org
    be.eu.org
    bg.eu.org
    ca.eu.org
    cd.eu.org
    ch.eu.org
    cn.eu.org
    cy.eu.org
    cz.eu.org
    de.eu.org
    dk.eu.org
    edu.eu.org
    ee.eu.org
    es.eu.org
    fi.eu.org
    fr.eu.org
    gr.eu.org
    hr.eu.org
    hu.eu.org
    ie.eu.org
    il.eu.org
    in.eu.org
    int.eu.org
    is.eu.org
    it.eu.org
    jp.eu.org
    kr.eu.org
    lt.eu.org
    lu.eu.org
    lv.eu.org
    mc.eu.org
    me.eu.org
    mk.eu.org
    mt.eu.org
    my.eu.org
    net.eu.org
    ng.eu.org
    nl.eu.org
    no.eu.org
    nz.eu.org
    paris.eu.org
    pl.eu.org
    pt.eu.org
    q-a.eu.org
    ro.eu.org
    ru.eu.org
    se.eu.org
    si.eu.org
    sk.eu.org
    tr.eu.org
    uk.eu.org
    us.eu.org

    // Eurobyte : https://eurobyte.ru
    // Submitted by Evgeniy Subbotin <e.subbotin@eurobyte.ru>
    eurodir.ru

    // Evennode : http://www.evennode.com/
    // Submitted by Michal Kralik <support@evennode.com>
    eu-1.evennode.com
    eu-2.evennode.com
    eu-3.evennode.com
    eu-4.evennode.com
    us-1.evennode.com
    us-2.evennode.com
    us-3.evennode.com
    us-4.evennode.com

    // eDirect Corp. : https://hosting.url.com.tw/
    // Submitted by C.S. chang <cschang@corp.url.com.tw>
    twmail.cc
    twmail.net
    twmail.org
    mymailer.com.tw
    url.tw

    // Fabrica Technologies, Inc. : https://www.fabrica.dev/
    // Submitted by Eric Jiang <eric@fabrica.dev>
    onfabrica.com

    // Facebook, Inc.
    // Submitted by Peter Ruibal <public-suffix@fb.com>
    apps.fbsbx.com

    // FAITID : https://faitid.org/
    // Submitted by Maxim Alzoba <tech.contact@faitid.org>
    // https://www.flexireg.net/stat_info
    ru.net
    adygeya.ru
    bashkiria.ru
    bir.ru
    cbg.ru
    com.ru
    dagestan.ru
    grozny.ru
    kalmykia.ru
    kustanai.ru
    marine.ru
    mordovia.ru
    msk.ru
    mytis.ru
    nalchik.ru
    nov.ru
    pyatigorsk.ru
    spb.ru
    vladikavkaz.ru
    vladimir.ru
    abkhazia.su
    adygeya.su
    aktyubinsk.su
    arkhangelsk.su
    armenia.su
    ashgabad.su
    azerbaijan.su
    balashov.su
    bashkiria.su
    bryansk.su
    bukhara.su
    chimkent.su
    dagestan.su
    east-kazakhstan.su
    exnet.su
    georgia.su
    grozny.su
    ivanovo.su
    jambyl.su
    kalmykia.su
    kaluga.su
    karacol.su
    karaganda.su
    karelia.su
    khakassia.su
    krasnodar.su
    kurgan.su
    kustanai.su
    lenug.su
    mangyshlak.su
    mordovia.su
    msk.su
    murmansk.su
    nalchik.su
    navoi.su
    north-kazakhstan.su
    nov.su
    obninsk.su
    penza.su
    pokrovsk.su
    sochi.su
    spb.su
    tashkent.su
    termez.su
    togliatti.su
    troitsk.su
    tselinograd.su
    tula.su
    tuva.su
    vladikavkaz.su
    vladimir.su
    vologda.su

    // Fancy Bits, LLC : http://getchannels.com
    // Submitted by Aman Gupta <aman@getchannels.com>
    channelsdvr.net
    u.channelsdvr.net

    // Fastly Inc. : http://www.fastly.com/
    // Submitted by Fastly Security <security@fastly.com>
    edgecompute.app
    fastly-terrarium.com
    fastlylb.net
    map.fastlylb.net
    freetls.fastly.net
    map.fastly.net
    a.prod.fastly.net
    global.prod.fastly.net
    a.ssl.fastly.net
    b.ssl.fastly.net
    global.ssl.fastly.net

    // Fastmail : https://www.fastmail.com/
    // Submitted by Marc Bradshaw <marc@fastmailteam.com>
    *.user.fm

    // FASTVPS EESTI OU : https://fastvps.ru/
    // Submitted by Likhachev Vasiliy <lihachev@fastvps.ru>
    fastvps-server.com
    fastvps.host
    myfast.host
    fastvps.site
    myfast.space

    // Fedora : https://fedoraproject.org/
    // submitted by Patrick Uiterwijk <puiterwijk@fedoraproject.org>
    fedorainfracloud.org
    fedorapeople.org
    cloud.fedoraproject.org
    app.os.fedoraproject.org
    app.os.stg.fedoraproject.org

    // FearWorks Media Ltd. : https://fearworksmedia.co.uk
    // submitted by Keith Fairley <domains@fearworksmedia.co.uk>
    conn.uk
    copro.uk
    hosp.uk

    // Fermax : https://fermax.com/
    // submitted by Koen Van Isterdael <k.vanisterdael@fermax.be>
    mydobiss.com

    // FH Muenster : https://www.fh-muenster.de
    // Submitted by Robin Naundorf <r.naundorf@fh-muenster.de>
    fh-muenster.io

    // Filegear Inc. : https://www.filegear.com
    // Submitted by Jason Zhu <jason@owtware.com>
    filegear.me
    filegear-au.me
    filegear-de.me
    filegear-gb.me
    filegear-ie.me
    filegear-jp.me
    filegear-sg.me

    // Firebase, Inc.
    // Submitted by Chris Raynor <chris@firebase.com>
    firebaseapp.com

    // Firewebkit : https://www.firewebkit.com
    // Submitted by Majid Qureshi <mqureshi@amrayn.com>
    fireweb.app

    // FLAP : https://www.flap.cloud
    // Submitted by Louis Chemineau <louis@chmn.me>
    flap.id

    // FlashDrive : https://flashdrive.io
    // Submitted by Eric Chan <support@flashdrive.io>
    onflashdrive.app
    fldrv.com

    // fly.io: https://fly.io
    // Submitted by Kurt Mackey <kurt@fly.io>
    fly.dev
    edgeapp.net
    shw.io

    // Flynn : https://flynn.io
    // Submitted by Jonathan Rudenberg <jonathan@flynn.io>
    flynnhosting.net

    // Forgerock : https://www.forgerock.com
    // Submitted by Roderick Parr <roderick.parr@forgerock.com>
    forgeblocks.com
    id.forgerock.io

    // Framer : https://www.framer.com
    // Submitted by Koen Rouwhorst <koenrh@framer.com>
    framer.app
    framercanvas.com
    framer.media
    framer.photos
    framer.website
    framer.wiki

    // Frusky MEDIA&PR : https://www.frusky.de
    // Submitted by Victor Pupynin <hallo@frusky.de>
    *.frusky.de

    // RavPage : https://www.ravpage.co.il
    // Submitted by Roni Horowitz <roni@responder.co.il>
    ravpage.co.il

    // Frederik Braun https://frederik-braun.com
    // Submitted by Frederik Braun <fb@frederik-braun.com>
    0e.vc

    // Freebox : http://www.freebox.fr
    // Submitted by Romain Fliedel <rfliedel@freebox.fr>
    freebox-os.com
    freeboxos.com
    fbx-os.fr
    fbxos.fr
    freebox-os.fr
    freeboxos.fr

    // freedesktop.org : https://www.freedesktop.org
    // Submitted by Daniel Stone <daniel@fooishbar.org>
    freedesktop.org

    // freemyip.com : https://freemyip.com
    // Submitted by Cadence <contact@freemyip.com>
    freemyip.com

    // FunkFeuer - Verein zur Förderung freier Netze : https://www.funkfeuer.at
    // Submitted by Daniel A. Maierhofer <vorstand@funkfeuer.at>
    wien.funkfeuer.at

    // Futureweb OG : http://www.futureweb.at
    // Submitted by Andreas Schnederle-Wagner <schnederle@futureweb.at>
    *.futurecms.at
    *.ex.futurecms.at
    *.in.futurecms.at
    futurehosting.at
    futuremailing.at
    *.ex.ortsinfo.at
    *.kunden.ortsinfo.at
    *.statics.cloud

    // GDS : https://www.gov.uk/service-manual/technology/managing-domain-names
    // Submitted by Stephen Ford <hostmaster@digital.cabinet-office.gov.uk>
    independent-commission.uk
    independent-inquest.uk
    independent-inquiry.uk
    independent-panel.uk
    independent-review.uk
    public-inquiry.uk
    royal-commission.uk
    campaign.gov.uk
    service.gov.uk

    // CDDO : https://www.gov.uk/guidance/get-an-api-domain-on-govuk
    // Submitted by Jamie Tanna <jamie.tanna@digital.cabinet-office.gov.uk>
    api.gov.uk

    // Gehirn Inc. : https://www.gehirn.co.jp/
    // Submitted by Kohei YOSHIDA <tech@gehirn.co.jp>
    gehirn.ne.jp
    usercontent.jp

    // Gentlent, Inc. : https://www.gentlent.com
    // Submitted by Tom Klein <tom@gentlent.com>
    gentapps.com
    gentlentapis.com
    lab.ms
    cdn-edges.net

    // Ghost Foundation : https://ghost.org
    // Submitted by Matt Hanley <security@ghost.org>
    ghost.io

    // GignoSystemJapan: http://gsj.bz
    // Submitted by GignoSystemJapan <kakutou-ec@gsj.bz>
    gsj.bz

    // GitHub, Inc.
    // Submitted by Patrick Toomey <security@github.com>
    githubusercontent.com
    githubpreview.dev
    github.io

    // GitLab, Inc.
    // Submitted by Alex Hanselka <alex@gitlab.com>
    gitlab.io

    // Gitplac.si - https://gitplac.si
    // Submitted by Aljaž Starc <me@aljaxus.eu>
    gitapp.si
    gitpage.si

    // Glitch, Inc : https://glitch.com
    // Submitted by Mads Hartmann <mads@glitch.com>
    glitch.me

    // Global NOG Alliance : https://nogalliance.org/
    // Submitted by Sander Steffann <sander@nogalliance.org>
    nog.community

    // Globe Hosting SRL : https://www.globehosting.com/
    // Submitted by Gavin Brown <gavin.brown@centralnic.com>
    co.ro
    shop.ro

    // GMO Pepabo, Inc. : https://pepabo.com/
    // Submitted by Hosting Div <admin@pepabo.com>
    lolipop.io
    angry.jp
    babyblue.jp
    babymilk.jp
    backdrop.jp
    bambina.jp
    bitter.jp
    blush.jp
    boo.jp
    boy.jp
    boyfriend.jp
    but.jp
    candypop.jp
    capoo.jp
    catfood.jp
    cheap.jp
    chicappa.jp
    chillout.jp
    chips.jp
    chowder.jp
    chu.jp
    ciao.jp
    cocotte.jp
    coolblog.jp
    cranky.jp
    cutegirl.jp
    daa.jp
    deca.jp
    deci.jp
    digick.jp
    egoism.jp
    fakefur.jp
    fem.jp
    flier.jp
    floppy.jp
    fool.jp
    frenchkiss.jp
    girlfriend.jp
    girly.jp
    gloomy.jp
    gonna.jp
    greater.jp
    hacca.jp
    heavy.jp
    her.jp
    hiho.jp
    hippy.jp
    holy.jp
    hungry.jp
    icurus.jp
    itigo.jp
    jellybean.jp
    kikirara.jp
    kill.jp
    kilo.jp
    kuron.jp
    littlestar.jp
    lolipopmc.jp
    lolitapunk.jp
    lomo.jp
    lovepop.jp
    lovesick.jp
    main.jp
    mods.jp
    mond.jp
    mongolian.jp
    moo.jp
    namaste.jp
    nikita.jp
    nobushi.jp
    noor.jp
    oops.jp
    parallel.jp
    parasite.jp
    pecori.jp
    peewee.jp
    penne.jp
    pepper.jp
    perma.jp
    pigboat.jp
    pinoko.jp
    punyu.jp
    pupu.jp
    pussycat.jp
    pya.jp
    raindrop.jp
    readymade.jp
    sadist.jp
    schoolbus.jp
    secret.jp
    staba.jp
    stripper.jp
    sub.jp
    sunnyday.jp
    thick.jp
    tonkotsu.jp
    under.jp
    upper.jp
    velvet.jp
    verse.jp
    versus.jp
    vivian.jp
    watson.jp
    weblike.jp
    whitesnow.jp
    zombie.jp
    heteml.net

    // GOV.UK Platform as a Service : https://www.cloud.service.gov.uk/
    // Submitted by Tom Whitwell <gov-uk-paas-support@digital.cabinet-office.gov.uk>
    cloudapps.digital
    london.cloudapps.digital

    // GOV.UK Pay : https://www.payments.service.gov.uk/
    // Submitted by Richard Baker <richard.baker@digital.cabinet-office.gov.uk>
    pymnt.uk

    // UKHomeOffice : https://www.gov.uk/government/organisations/home-office
    // Submitted by Jon Shanks <jon.shanks@digital.homeoffice.gov.uk>
    homeoffice.gov.uk

    // GlobeHosting, Inc.
    // Submitted by Zoltan Egresi <egresi@globehosting.com>
    ro.im

    // GoIP DNS Services : http://www.goip.de
    // Submitted by Christian Poulter <milchstrasse@goip.de>
    goip.de

    // Google, Inc.
    // Submitted by Eduardo Vela <evn@google.com>
    run.app
    a.run.app
    web.app
    *.0emm.com
    appspot.com
    *.r.appspot.com
    codespot.com
    googleapis.com
    googlecode.com
    pagespeedmobilizer.com
    publishproxy.com
    withgoogle.com
    withyoutube.com
    *.gateway.dev
    cloud.goog
    translate.goog
    *.usercontent.goog
    cloudfunctions.net
    blogspot.ae
    blogspot.al
    blogspot.am
    blogspot.ba
    blogspot.be
    blogspot.bg
    blogspot.bj
    blogspot.ca
    blogspot.cf
    blogspot.ch
    blogspot.cl
    blogspot.co.at
    blogspot.co.id
    blogspot.co.il
    blogspot.co.ke
    blogspot.co.nz
    blogspot.co.uk
    blogspot.co.za
    blogspot.com
    blogspot.com.ar
    blogspot.com.au
    blogspot.com.br
    blogspot.com.by
    blogspot.com.co
    blogspot.com.cy
    blogspot.com.ee
    blogspot.com.eg
    blogspot.com.es
    blogspot.com.mt
    blogspot.com.ng
    blogspot.com.tr
    blogspot.com.uy
    blogspot.cv
    blogspot.cz
    blogspot.de
    blogspot.dk
    blogspot.fi
    blogspot.fr
    blogspot.gr
    blogspot.hk
    blogspot.hr
    blogspot.hu
    blogspot.ie
    blogspot.in
    blogspot.is
    blogspot.it
    blogspot.jp
    blogspot.kr
    blogspot.li
    blogspot.lt
    blogspot.lu
    blogspot.md
    blogspot.mk
    blogspot.mr
    blogspot.mx
    blogspot.my
    blogspot.nl
    blogspot.no
    blogspot.pe
    blogspot.pt
    blogspot.qa
    blogspot.re
    blogspot.ro
    blogspot.rs
    blogspot.ru
    blogspot.se
    blogspot.sg
    blogspot.si
    blogspot.sk
    blogspot.sn
    blogspot.td
    blogspot.tw
    blogspot.ug
    blogspot.vn

    // Goupile : https://goupile.fr
    // Submitted by Niels Martignene <hello@goupile.fr>
    goupile.fr

    // Government of the Netherlands: https://www.government.nl
    // Submitted by <domeinnaam@minaz.nl>
    gov.nl

    // Group 53, LLC : https://www.group53.com
    // Submitted by Tyler Todd <noc@nova53.net>
    awsmppl.com

    // GünstigBestellen : https://günstigbestellen.de
    // Submitted by Furkan Akkoc <info@hendelzon.de>
    günstigbestellen.de
    günstigliefern.de

    // Hakaran group: http://hakaran.cz
    // Submitted by Arseniy Sokolov <security@hakaran.cz>
    fin.ci
    free.hr
    caa.li
    ua.rs
    conf.se

    // Handshake : https://handshake.org
    // Submitted by Mike Damm <md@md.vc>
    hs.zone
    hs.run

    // Hashbang : https://hashbang.sh
    hashbang.sh

    // Hasura : https://hasura.io
    // Submitted by Shahidh K Muhammed <shahidh@hasura.io>
    hasura.app
    hasura-app.io

    // Heilbronn University of Applied Sciences - Faculty Informatics (GitLab Pages): https://www.hs-heilbronn.de
    // Submitted by Richard Zowalla <mi-admin@hs-heilbronn.de>
    pages.it.hs-heilbronn.de

    // Hepforge : https://www.hepforge.org
    // Submitted by David Grellscheid <admin@hepforge.org>
    hepforge.org

    // Heroku : https://www.heroku.com/
    // Submitted by Tom Maher <tmaher@heroku.com>
    herokuapp.com
    herokussl.com

    // Hibernating Rhinos
    // Submitted by Oren Eini <oren@ravendb.net>
    ravendb.cloud
    ravendb.community
    ravendb.me
    development.run
    ravendb.run

    // home.pl S.A.: https://home.pl
    // Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
    homesklep.pl

    // Hong Kong Productivity Council: https://www.hkpc.org/
    // Submitted by SECaaS Team <summchan@hkpc.org>
    secaas.hk

    // Hoplix : https://www.hoplix.com
    // Submitted by Danilo De Franco<info@hoplix.shop>
    hoplix.shop


    // HOSTBIP REGISTRY : https://www.hostbip.com/
    // Submitted by Atanunu Igbunuroghene <publicsuffixlist@hostbip.com>
    orx.biz
    biz.gl
    col.ng
    firm.ng
    gen.ng
    ltd.ng
    ngo.ng
    edu.scot
    sch.so

    // HostyHosting (hostyhosting.com)
    hostyhosting.io

    // Häkkinen.fi
    // Submitted by Eero Häkkinen <Eero+psl@Häkkinen.fi>
    häkkinen.fi

    // Ici la Lune : http://www.icilalune.com/
    // Submitted by Simon Morvan <simon@icilalune.com>
    *.moonscale.io
    moonscale.net

    // iki.fi
    // Submitted by Hannu Aronsson <haa@iki.fi>
    iki.fi

    // iliad italia: https://www.iliad.it
    // Submitted by Marios Makassikis <mmakassikis@freebox.fr>
    ibxos.it
    iliadboxos.it

    // Impertrix Solutions : <https://impertrixcdn.com>
    // Submitted by Zhixiang Zhao <csuite@impertrix.com>
    impertrixcdn.com
    impertrix.com

    // Incsub, LLC: https://incsub.com/
    // Submitted by Aaron Edwards <sysadmins@incsub.com>
    smushcdn.com
    wphostedmail.com
    wpmucdn.com
    tempurl.host
    wpmudev.host

    // Individual Network Berlin e.V. : https://www.in-berlin.de/
    // Submitted by Christian Seitz <chris@in-berlin.de>
    dyn-berlin.de
    in-berlin.de
    in-brb.de
    in-butter.de
    in-dsl.de
    in-dsl.net
    in-dsl.org
    in-vpn.de
    in-vpn.net
    in-vpn.org

    // info.at : http://www.info.at/
    biz.at
    info.at

    // info.cx : http://info.cx
    // Submitted by Jacob Slater <whois@igloo.to>
    info.cx

    // Interlegis : http://www.interlegis.leg.br
    // Submitted by Gabriel Ferreira <registrobr@interlegis.leg.br>
    ac.leg.br
    al.leg.br
    am.leg.br
    ap.leg.br
    ba.leg.br
    ce.leg.br
    df.leg.br
    es.leg.br
    go.leg.br
    ma.leg.br
    mg.leg.br
    ms.leg.br
    mt.leg.br
    pa.leg.br
    pb.leg.br
    pe.leg.br
    pi.leg.br
    pr.leg.br
    rj.leg.br
    rn.leg.br
    ro.leg.br
    rr.leg.br
    rs.leg.br
    sc.leg.br
    se.leg.br
    sp.leg.br
    to.leg.br

    // intermetrics GmbH : https://pixolino.com/
    // Submitted by Wolfgang Schwarz <admin@intermetrics.de>
    pixolino.com

    // Internet-Pro, LLP: https://netangels.ru/
    // Submitted by Vasiliy Sheredeko <piphon@gmail.com>
    na4u.ru

    // iopsys software solutions AB : https://iopsys.eu/
    // Submitted by Roman Azarenko <roman.azarenko@iopsys.eu>
    iopsys.se

    // IPiFony Systems, Inc. : https://www.ipifony.com/
    // Submitted by Matthew Hardeman <mhardeman@ipifony.com>
    ipifony.net

    // IServ GmbH : https://iserv.de
    // Submitted by Mario Hoberg <info@iserv.de>
    iservschule.de
    mein-iserv.de
    schulplattform.de
    schulserver.de
    test-iserv.de
    iserv.dev

    // I-O DATA DEVICE, INC. : http://www.iodata.com/
    // Submitted by Yuji Minagawa <domains-admin@iodata.jp>
    iobb.net

    // Jelastic, Inc. : https://jelastic.com/
    // Submitted by Ihor Kolodyuk <ik@jelastic.com>
    mel.cloudlets.com.au
    cloud.interhostsolutions.be
    users.scale.virtualcloud.com.br
    mycloud.by
    alp1.ae.flow.ch
    appengine.flow.ch
    es-1.axarnet.cloud
    diadem.cloud
    vip.jelastic.cloud
    jele.cloud
    it1.eur.aruba.jenv-aruba.cloud
    it1.jenv-aruba.cloud
    keliweb.cloud
    cs.keliweb.cloud
    oxa.cloud
    tn.oxa.cloud
    uk.oxa.cloud
    primetel.cloud
    uk.primetel.cloud
    ca.reclaim.cloud
    uk.reclaim.cloud
    us.reclaim.cloud
    ch.trendhosting.cloud
    de.trendhosting.cloud
    jele.club
    amscompute.com
    clicketcloud.com
    dopaas.com
    hidora.com
    paas.hosted-by-previder.com
    rag-cloud.hosteur.com
    rag-cloud-ch.hosteur.com
    jcloud.ik-server.com
    jcloud-ver-jpc.ik-server.com
    demo.jelastic.com
    kilatiron.com
    paas.massivegrid.com
    jed.wafaicloud.com
    lon.wafaicloud.com
    ryd.wafaicloud.com
    j.scaleforce.com.cy
    jelastic.dogado.eu
    fi.cloudplatform.fi
    demo.datacenter.fi
    paas.datacenter.fi
    jele.host
    mircloud.host
    paas.beebyte.io
    sekd1.beebyteapp.io
    jele.io
    cloud-fr1.unispace.io
    jc.neen.it
    cloud.jelastic.open.tim.it
    jcloud.kz
    upaas.kazteleport.kz
    cloudjiffy.net
    fra1-de.cloudjiffy.net
    west1-us.cloudjiffy.net
    jls-sto1.elastx.net
    jls-sto2.elastx.net
    jls-sto3.elastx.net
    faststacks.net
    fr-1.paas.massivegrid.net
    lon-1.paas.massivegrid.net
    lon-2.paas.massivegrid.net
    ny-1.paas.massivegrid.net
    ny-2.paas.massivegrid.net
    sg-1.paas.massivegrid.net
    jelastic.saveincloud.net
    nordeste-idc.saveincloud.net
    j.scaleforce.net
    jelastic.tsukaeru.net
    sdscloud.pl
    unicloud.pl
    mircloud.ru
    jelastic.regruhosting.ru
    enscaled.sg
    jele.site
    jelastic.team
    orangecloud.tn
    j.layershift.co.uk
    phx.enscaled.us
    mircloud.us

    // Jino : https://www.jino.ru
    // Submitted by Sergey Ulyashin <ulyashin@jino.ru>
    myjino.ru
    *.hosting.myjino.ru
    *.landing.myjino.ru
    *.spectrum.myjino.ru
    *.vps.myjino.ru

    // Jotelulu S.L. : https://jotelulu.com
    // Submitted by Daniel Fariña <ingenieria@jotelulu.com>
    jotelulu.cloud

    // Joyent : https://www.joyent.com/
    // Submitted by Brian Bennett <brian.bennett@joyent.com>
    *.triton.zone
    *.cns.joyent.com

    // JS.ORG : http://dns.js.org
    // Submitted by Stefan Keim <admin@js.org>
    js.org

    // KaasHosting : http://www.kaashosting.nl/
    // Submitted by Wouter Bakker <hostmaster@kaashosting.nl>
    kaas.gg
    khplay.nl

    // Kakao : https://www.kakaocorp.com/
    // Submitted by JaeYoong Lee <cec@kakaocorp.com>
    ktistory.com

    // Kapsi : https://kapsi.fi
    // Submitted by Tomi Juntunen <erani@kapsi.fi>
    kapsi.fi

    // Keyweb AG : https://www.keyweb.de
    // Submitted by Martin Dannehl <postmaster@keymachine.de>
    keymachine.de

    // KingHost : https://king.host
    // Submitted by Felipe Keller Braz <felipebraz@kinghost.com.br>
    kinghost.net
    uni5.net

    // KnightPoint Systems, LLC : http://www.knightpoint.com/
    // Submitted by Roy Keene <rkeene@knightpoint.com>
    knightpoint.systems

    // KoobinEvent, SL: https://www.koobin.com
    // Submitted by Iván Oliva <ivan.oliva@koobin.com>
    koobin.events

    // KUROKU LTD : https://kuroku.ltd/
    // Submitted by DisposaBoy <security@oya.to>
    oya.to

    // Katholieke Universiteit Leuven: https://www.kuleuven.be
    // Submitted by Abuse KU Leuven <abuse@kuleuven.be>
    kuleuven.cloud
    ezproxy.kuleuven.be

    // .KRD : http://nic.krd/data/krd/Registration%20Policy.pdf
    co.krd
    edu.krd

    // Krellian Ltd. : https://krellian.com
    // Submitted by Ben Francis <ben@krellian.com>
    krellian.net
    webthings.io

    // LCube - Professional hosting e.K. : https://www.lcube-webhosting.de
    // Submitted by Lars Laehn <info@lcube.de>
    git-repos.de
    lcube-server.de
    svn-repos.de

    // Leadpages : https://www.leadpages.net
    // Submitted by Greg Dallavalle <domains@leadpages.net>
    leadpages.co
    lpages.co
    lpusercontent.com

    // Lelux.fi : https://lelux.fi/
    // Submitted by Lelux Admin <publisuffix@lelux.site>
    lelux.site

    // Lifetime Hosting : https://Lifetime.Hosting/
    // Submitted by Mike Fillator <support@lifetime.hosting>
    co.business
    co.education
    co.events
    co.financial
    co.network
    co.place
    co.technology

    // Lightmaker Property Manager, Inc. : https://app.lmpm.com/
    // Submitted by Greg Holland <greg.holland@lmpm.com>
    app.lmpm.com

    // linkyard ldt: https://www.linkyard.ch/
    // Submitted by Mario Siegenthaler <mario.siegenthaler@linkyard.ch>
    linkyard.cloud
    linkyard-cloud.ch

    // Linode : https://linode.com
    // Submitted by <security@linode.com>
    members.linode.com
    *.nodebalancer.linode.com
    *.linodeobjects.com
    ip.linodeusercontent.com

    // LiquidNet Ltd : http://www.liquidnetlimited.com/
    // Submitted by Victor Velchev <admin@liquidnetlimited.com>
    we.bs

    // Localcert : https://localcert.dev
    // Submitted by Lann Martin <security@localcert.dev>
    *.user.localcert.dev

    // localzone.xyz
    // Submitted by Kenny Niehage <hello@yahe.sh>
    localzone.xyz

    // Log'in Line : https://www.loginline.com/
    // Submitted by Rémi Mach <remi.mach@loginline.com>
    loginline.app
    loginline.dev
    loginline.io
    loginline.services
    loginline.site

    // Lokalized : https://lokalized.nl
    // Submitted by Noah Taheij <noah@lokalized.nl>
    servers.run

    // Lõhmus Family, The
    // Submitted by Heiki Lõhmus <hostmaster at lohmus dot me>
    lohmus.me

    // LubMAN UMCS Sp. z o.o : https://lubman.pl/
    // Submitted by Ireneusz Maliszewski <ireneusz.maliszewski@lubman.pl>
    krasnik.pl
    leczna.pl
    lubartow.pl
    lublin.pl
    poniatowa.pl
    swidnik.pl

    // Lug.org.uk : https://lug.org.uk
    // Submitted by Jon Spriggs <admin@lug.org.uk>
    glug.org.uk
    lug.org.uk
    lugs.org.uk

    // Lukanet Ltd : https://lukanet.com
    // Submitted by Anton Avramov <register@lukanet.com>
    barsy.bg
    barsy.co.uk
    barsyonline.co.uk
    barsycenter.com
    barsyonline.com
    barsy.club
    barsy.de
    barsy.eu
    barsy.in
    barsy.info
    barsy.io
    barsy.me
    barsy.menu
    barsy.mobi
    barsy.net
    barsy.online
    barsy.org
    barsy.pro
    barsy.pub
    barsy.ro
    barsy.shop
    barsy.site
    barsy.support
    barsy.uk

    // Magento Commerce
    // Submitted by Damien Tournoud <dtournoud@magento.cloud>
    *.magentosite.cloud

    // May First - People Link : https://mayfirst.org/
    // Submitted by Jamie McClelland <info@mayfirst.org>
    mayfirst.info
    mayfirst.org

    // Mail.Ru Group : https://hb.cldmail.ru
    // Submitted by Ilya Zaretskiy <zaretskiy@corp.mail.ru>
    hb.cldmail.ru

    // Mail Transfer Platform : https://www.neupeer.com
    // Submitted by Li Hui <lihui@neupeer.com>
    cn.vu

    // Maze Play: https://www.mazeplay.com
    // Submitted by Adam Humpherys <adam@mws.dev>
    mazeplay.com

    // mcpe.me : https://mcpe.me
    // Submitted by Noa Heyl <hi@noa.dev>
    mcpe.me

    // McHost : https://mchost.ru
    // Submitted by Evgeniy Subbotin <e.subbotin@mchost.ru>
    mcdir.me
    mcdir.ru
    mcpre.ru
    vps.mcdir.ru

    // Mediatech : https://mediatech.by
    // Submitted by Evgeniy Kozhuhovskiy <ugenk@mediatech.by>
    mediatech.by
    mediatech.dev

    // Medicom Health : https://medicomhealth.com
    // Submitted by Michael Olson <molson@medicomhealth.com>
    hra.health

    // Memset hosting : https://www.memset.com
    // Submitted by Tom Whitwell <domains@memset.com>
    miniserver.com
    memset.net

    // Messerli Informatik AG : https://www.messerli.ch/
    // Submitted by Ruben Schmidmeister <psl-maintainers@messerli.ch>
    messerli.app

    // MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
    // Submitted by Zdeněk Šustr <zdenek.sustr@cesnet.cz>
    *.cloud.metacentrum.cz
    custom.metacentrum.cz

    // MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
    // Submitted by Radim Janča <janca@cesnet.cz>
    flt.cloud.muni.cz
    usr.cloud.muni.cz

    // Meteor Development Group : https://www.meteor.com/hosting
    // Submitted by Pierre Carrier <pierre@meteor.com>
    meteorapp.com
    eu.meteorapp.com

    // Michau Enterprises Limited : http://www.co.pl/
    co.pl

    // Microsoft Corporation : http://microsoft.com
    // Submitted by Public Suffix List Admin <msftpsladmin@microsoft.com>
    *.azurecontainer.io
    azurewebsites.net
    azure-mobile.net
    cloudapp.net
    azurestaticapps.net
    1.azurestaticapps.net
    2.azurestaticapps.net
    centralus.azurestaticapps.net
    eastasia.azurestaticapps.net
    eastus2.azurestaticapps.net
    westeurope.azurestaticapps.net
    westus2.azurestaticapps.net

    // minion.systems : http://minion.systems
    // Submitted by Robert Böttinger <r@minion.systems>
    csx.cc

    // Mintere : https://mintere.com/
    // Submitted by Ben Aubin <security@mintere.com>
    mintere.site

    // MobileEducation, LLC : https://joinforte.com
    // Submitted by Grayson Martin <grayson.martin@mobileeducation.us>
    forte.id

    // Mozilla Corporation : https://mozilla.com
    // Submitted by Ben Francis <bfrancis@mozilla.com>
    mozilla-iot.org

    // Mozilla Foundation : https://mozilla.org/
    // Submitted by glob <glob@mozilla.com>
    bmoattachments.org

    // MSK-IX : https://www.msk-ix.ru/
    // Submitted by Khannanov Roman <r.khannanov@msk-ix.ru>
    net.ru
    org.ru
    pp.ru

    // Mythic Beasts : https://www.mythic-beasts.com
    // Submitted by Paul Cammish <kelduum@mythic-beasts.com>
    hostedpi.com
    customer.mythic-beasts.com
    caracal.mythic-beasts.com
    fentiger.mythic-beasts.com
    lynx.mythic-beasts.com
    ocelot.mythic-beasts.com
    oncilla.mythic-beasts.com
    onza.mythic-beasts.com
    sphinx.mythic-beasts.com
    vs.mythic-beasts.com
    x.mythic-beasts.com
    yali.mythic-beasts.com
    cust.retrosnub.co.uk

    // Nabu Casa : https://www.nabucasa.com
    // Submitted by Paulus Schoutsen <infra@nabucasa.com>
    ui.nabu.casa

    // Net at Work Gmbh : https://www.netatwork.de
    // Submitted by Jan Jaeschke <jan.jaeschke@netatwork.de>
    cloud.nospamproxy.com

    // Netlify : https://www.netlify.com
    // Submitted by Jessica Parsons <jessica@netlify.com>
    netlify.app

    // Neustar Inc.
    // Submitted by Trung Tran <Trung.Tran@neustar.biz>
    4u.com

    // ngrok : https://ngrok.com/
    // Submitted by Alan Shreve <alan@ngrok.com>
    ngrok.io

    // Nimbus Hosting Ltd. : https://www.nimbushosting.co.uk/
    // Submitted by Nicholas Ford <nick@nimbushosting.co.uk>
    nh-serv.co.uk

    // NFSN, Inc. : https://www.NearlyFreeSpeech.NET/
    // Submitted by Jeff Wheelhouse <support@nearlyfreespeech.net>
    nfshost.com

    // Noop : https://noop.app
    // Submitted by Nathaniel Schweinberg <noop@rearc.io>
    *.developer.app
    noop.app

    // Northflank Ltd. : https://northflank.com/
    // Submitted by Marco Suter <marco@northflank.com>
    *.northflank.app
    *.build.run
    *.code.run
    *.database.run
    *.migration.run

    // Noticeable : https://noticeable.io
    // Submitted by Laurent Pellegrino <security@noticeable.io>
    noticeable.news

    // Now-DNS : https://now-dns.com
    // Submitted by Steve Russell <steve@now-dns.com>
    dnsking.ch
    mypi.co
    n4t.co
    001www.com
    ddnslive.com
    myiphost.com
    forumz.info
    16-b.it
    32-b.it
    64-b.it
    soundcast.me
    tcp4.me
    dnsup.net
    hicam.net
    now-dns.net
    ownip.net
    vpndns.net
    dynserv.org
    now-dns.org
    x443.pw
    now-dns.top
    ntdll.top
    freeddns.us
    crafting.xyz
    zapto.xyz

    // nsupdate.info : https://www.nsupdate.info/
    // Submitted by Thomas Waldmann <info@nsupdate.info>
    nsupdate.info
    nerdpol.ovh

    // No-IP.com : https://noip.com/
    // Submitted by Deven Reza <publicsuffixlist@noip.com>
    blogsyte.com
    brasilia.me
    cable-modem.org
    ciscofreak.com
    collegefan.org
    couchpotatofries.org
    damnserver.com
    ddns.me
    ditchyourip.com
    dnsfor.me
    dnsiskinky.com
    dvrcam.info
    dynns.com
    eating-organic.net
    fantasyleague.cc
    geekgalaxy.com
    golffan.us
    health-carereform.com
    homesecuritymac.com
    homesecuritypc.com
    hopto.me
    ilovecollege.info
    loginto.me
    mlbfan.org
    mmafan.biz
    myactivedirectory.com
    mydissent.net
    myeffect.net
    mymediapc.net
    mypsx.net
    mysecuritycamera.com
    mysecuritycamera.net
    mysecuritycamera.org
    net-freaks.com
    nflfan.org
    nhlfan.net
    no-ip.ca
    no-ip.co.uk
    no-ip.net
    noip.us
    onthewifi.com
    pgafan.net
    point2this.com
    pointto.us
    privatizehealthinsurance.net
    quicksytes.com
    read-books.org
    securitytactics.com
    serveexchange.com
    servehumour.com
    servep2p.com
    servesarcasm.com
    stufftoread.com
    ufcfan.org
    unusualperson.com
    workisboring.com
    3utilities.com
    bounceme.net
    ddns.net
    ddnsking.com
    gotdns.ch
    hopto.org
    myftp.biz
    myftp.org
    myvnc.com
    no-ip.biz
    no-ip.info
    no-ip.org
    noip.me
    redirectme.net
    servebeer.com
    serveblog.net
    servecounterstrike.com
    serveftp.com
    servegame.com
    servehalflife.com
    servehttp.com
    serveirc.com
    serveminecraft.net
    servemp3.com
    servepics.com
    servequake.com
    sytes.net
    webhop.me
    zapto.org

    // NodeArt : https://nodeart.io
    // Submitted by Konstantin Nosov <Nosov@nodeart.io>
    stage.nodeart.io

    // Nucleos Inc. : https://nucleos.com
    // Submitted by Piotr Zduniak <piotr@nucleos.com>
    pcloud.host

    // NYC.mn : http://www.information.nyc.mn
    // Submitted by Matthew Brown <mattbrown@nyc.mn>
    nyc.mn

    // Observable, Inc. : https://observablehq.com
    // Submitted by Mike Bostock <dns@observablehq.com>
    static.observableusercontent.com

    // Octopodal Solutions, LLC. : https://ulterius.io/
    // Submitted by Andrew Sampson <andrew@ulterius.io>
    cya.gg

    // OMG.LOL : <https://omg.lol>
    // Submitted by Adam Newbold <adam@omg.lol>
    omg.lol

    // Omnibond Systems, LLC. : https://www.omnibond.com
    // Submitted by Cole Estep <cole@omnibond.com>
    cloudycluster.net

    // OmniWe Limited: https://omniwe.com
    // Submitted by Vicary Archangel <vicary@omniwe.com>
    omniwe.site

    // One.com: https://www.one.com/
    // Submitted by Jacob Bunk Nielsen <jbn@one.com>
    123hjemmeside.dk
    123hjemmeside.no
    123homepage.it
    123kotisivu.fi
    123minsida.se
    123miweb.es
    123paginaweb.pt
    123sait.ru
    123siteweb.fr
    123webseite.at
    123webseite.de
    123website.be
    123website.ch
    123website.lu
    123website.nl
    service.one
    simplesite.com
    simplesite.com.br
    simplesite.gr
    simplesite.pl

    // One Fold Media : http://www.onefoldmedia.com/
    // Submitted by Eddie Jones <eddie@onefoldmedia.com>
    nid.io

    // Open Social : https://www.getopensocial.com/
    // Submitted by Alexander Varwijk <security@getopensocial.com>
    opensocial.site

    // OpenCraft GmbH : http://opencraft.com/
    // Submitted by Sven Marnach <sven@opencraft.com>
    opencraft.hosting

    // OpenResearch GmbH: https://openresearch.com/
    // Submitted by Philipp Schmid <ops@openresearch.com>
    orsites.com

    // Opera Software, A.S.A.
    // Submitted by Yngve Pettersen <yngve@opera.com>
    operaunite.com

    // Orange : https://www.orange.com
    // Submitted by Alexandre Linte <alexandre.linte@orange.com>
    tech.orange

    // Oursky Limited : https://authgear.com/, https://skygear.io/
    // Submitted by Authgear Team <hello@authgear.com>, Skygear Developer <hello@skygear.io>
    authgear-staging.com
    authgearapps.com
    skygearapp.com

    // OutSystems
    // Submitted by Duarte Santos <domain-admin@outsystemscloud.com>
    outsystemscloud.com

    // OVHcloud: https://ovhcloud.com
    // Submitted by Vincent Cassé <vincent.casse@ovhcloud.com>
    *.webpaas.ovh.net
    *.hosting.ovh.net

    // OwnProvider GmbH: http://www.ownprovider.com
    // Submitted by Jan Moennich <jan.moennich@ownprovider.com>
    ownprovider.com
    own.pm

    // OwO : https://whats-th.is/
    // Submitted by Dean Sheather <dean@deansheather.com>
    *.owo.codes

    // OX : http://www.ox.rs
    // Submitted by Adam Grand <webmaster@mail.ox.rs>
    ox.rs

    // oy.lc
    // Submitted by Charly Coste <changaco@changaco.oy.lc>
    oy.lc

    // Pagefog : https://pagefog.com/
    // Submitted by Derek Myers <derek@pagefog.com>
    pgfog.com

    // Pagefront : https://www.pagefronthq.com/
    // Submitted by Jason Kriss <jason@pagefronthq.com>
    pagefrontapp.com

    // PageXL : https://pagexl.com
    // Submitted by Yann Guichard <yann@pagexl.com>
    pagexl.com

    // Paywhirl, Inc : https://paywhirl.com/
    // Submitted by Daniel Netzer <dan@paywhirl.com>
    *.paywhirl.com

    // pcarrier.ca Software Inc: https://pcarrier.ca/
    // Submitted by Pierre Carrier <pc@rrier.ca>
    bar0.net
    bar1.net
    bar2.net
    rdv.to

    // .pl domains (grandfathered)
    art.pl
    gliwice.pl
    krakow.pl
    poznan.pl
    wroc.pl
    zakopane.pl

    // Pantheon Systems, Inc. : https://pantheon.io/
    // Submitted by Gary Dylina <gary@pantheon.io>
    pantheonsite.io
    gotpantheon.com

    // Peplink | Pepwave : http://peplink.com/
    // Submitted by Steve Leung <steveleung@peplink.com>
    mypep.link

    // Perspecta : https://perspecta.com/
    // Submitted by Kenneth Van Alstyne <kvanalstyne@perspecta.com>
    perspecta.cloud

    // PE Ulyanov Kirill Sergeevich : https://airy.host
    // Submitted by Kirill Ulyanov <k.ulyanov@airy.host>
    lk3.ru

    // Planet-Work : https://www.planet-work.com/
    // Submitted by Frédéric VANNIÈRE <f.vanniere@planet-work.com>
    on-web.fr

    // Platform.sh : https://platform.sh
    // Submitted by Nikola Kotur <nikola@platform.sh>
    bc.platform.sh
    ent.platform.sh
    eu.platform.sh
    us.platform.sh
    *.platformsh.site
    *.tst.site

    // Platter: https://platter.dev
    // Submitted by Patrick Flor <patrick@platter.dev>
    platter-app.com
    platter-app.dev
    platterp.us

    // Plesk : https://www.plesk.com/
    // Submitted by Anton Akhtyamov <program-managers@plesk.com>
    pdns.page
    plesk.page
    pleskns.com

    // Port53 : https://port53.io/
    // Submitted by Maximilian Schieder <maxi@zeug.co>
    dyn53.io

    // Porter : https://porter.run/
    // Submitted by Rudraksh MK <rudi@porter.run>
    onporter.run

    // Positive Codes Technology Company : http://co.bn/faq.html
    // Submitted by Zulfais <pc@co.bn>
    co.bn

    // Postman, Inc : https://postman.com
    // Submitted by Rahul Dhawan <security@postman.com>
    postman-echo.com
    pstmn.io
    mock.pstmn.io
    httpbin.org

    //prequalifyme.today : https://prequalifyme.today
    //Submitted by DeepakTiwari deepak@ivylead.io
    prequalifyme.today

    // prgmr.com : https://prgmr.com/
    // Submitted by Sarah Newman <owner@prgmr.com>
    xen.prgmr.com

    // priv.at : http://www.nic.priv.at/
    // Submitted by registry <lendl@nic.at>
    priv.at

    // privacytools.io : https://www.privacytools.io/
    // Submitted by Jonah Aragon <jonah@privacytools.io>
    prvcy.page

    // Protocol Labs : https://protocol.ai/
    // Submitted by Michael Burns <noc@protocol.ai>
    *.dweb.link

    // Protonet GmbH : http://protonet.io
    // Submitted by Martin Meier <admin@protonet.io>
    protonet.io

    // Publication Presse Communication SARL : https://ppcom.fr
    // Submitted by Yaacov Akiba Slama <admin@chirurgiens-dentistes-en-france.fr>
    chirurgiens-dentistes-en-france.fr
    byen.site

    // pubtls.org: https://www.pubtls.org
    // Submitted by Kor Nielsen <kor@pubtls.org>
    pubtls.org

    // PythonAnywhere LLP: https://www.pythonanywhere.com
    // Submitted by Giles Thomas <giles@pythonanywhere.com>
    pythonanywhere.com
    eu.pythonanywhere.com

    // QOTO, Org.
    // Submitted by Jeffrey Phillips Freeman <jeffrey.freeman@qoto.org>
    qoto.io

    // Qualifio : https://qualifio.com/
    // Submitted by Xavier De Cock <xdecock@gmail.com>
    qualifioapp.com

    // QuickBackend: https://www.quickbackend.com
    // Submitted by Dani Biro <dani@pymet.com>
    qbuser.com

    // Rad Web Hosting: https://radwebhosting.com
    // Submitted by Scott Claeys <s.claeys@radwebhosting.com>
    cloudsite.builders

    // Redgate Software: https://red-gate.com
    // Submitted by Andrew Farries <andrew.farries@red-gate.com>
    instances.spawn.cc

    // Redstar Consultants : https://www.redstarconsultants.com/
    // Submitted by Jons Slemmer <jons@redstarconsultants.com>
    instantcloud.cn

    // Russian Academy of Sciences
    // Submitted by Tech Support <support@rasnet.ru>
    ras.ru

    // QA2
    // Submitted by Daniel Dent (https://www.danieldent.com/)
    qa2.com

    // QCX
    // Submitted by Cassandra Beelen <cassandra@beelen.one>
    qcx.io
    *.sys.qcx.io

    // QNAP System Inc : https://www.qnap.com
    // Submitted by Nick Chang <nickchang@qnap.com>
    dev-myqnapcloud.com
    alpha-myqnapcloud.com
    myqnapcloud.com

    // Quip : https://quip.com
    // Submitted by Patrick Linehan <plinehan@quip.com>
    *.quipelements.com

    // Qutheory LLC : http://qutheory.io
    // Submitted by Jonas Schwartz <jonas@qutheory.io>
    vapor.cloud
    vaporcloud.io

    // Rackmaze LLC : https://www.rackmaze.com
    // Submitted by Kirill Pertsev <kika@rackmaze.com>
    rackmaze.com
    rackmaze.net

    // Rakuten Games, Inc : https://dev.viberplay.io
    // Submitted by Joshua Zhang <public-suffix@rgames.jp>
    g.vbrplsbx.io

    // Rancher Labs, Inc : https://rancher.com
    // Submitted by Vincent Fiduccia <domains@rancher.com>
    *.on-k3s.io
    *.on-rancher.cloud
    *.on-rio.io

    // Read The Docs, Inc : https://www.readthedocs.org
    // Submitted by David Fischer <team@readthedocs.org>
    readthedocs.io

    // Red Hat, Inc. OpenShift : https://openshift.redhat.com/
    // Submitted by Tim Kramer <tkramer@rhcloud.com>
    rhcloud.com

    // Render : https://render.com
    // Submitted by Anurag Goel <dev@render.com>
    app.render.com
    onrender.com

    // Repl.it : https://repl.it
    // Submitted by Lincoln Bergeson <lincoln@replit.com>
    firewalledreplit.co
    id.firewalledreplit.co
    repl.co
    id.repl.co
    repl.run

    // Resin.io : https://resin.io
    // Submitted by Tim Perry <tim@resin.io>
    resindevice.io
    devices.resinstaging.io

    // RethinkDB : https://www.rethinkdb.com/
    // Submitted by Chris Kastorff <info@rethinkdb.com>
    hzc.io

    // Revitalised Limited : http://www.revitalised.co.uk
    // Submitted by Jack Price <jack@revitalised.co.uk>
    wellbeingzone.eu
    wellbeingzone.co.uk

    // Rico Developments Limited : https://adimo.co
    // Submitted by Colin Brown <hello@adimo.co>
    adimo.co.uk

    // Riseup Networks : https://riseup.net
    // Submitted by Micah Anderson <micah@riseup.net>
    itcouldbewor.se

    // Rochester Institute of Technology : http://www.rit.edu/
    // Submitted by Jennifer Herting <jchits@rit.edu>
    git-pages.rit.edu

    // Rocky Enterprise Software Foundation : https://resf.org
    // Submitted by Neil Hanlon <neil@resf.org>
    rocky.page

    // Rusnames Limited: http://rusnames.ru/
    // Submitted by Sergey Zotov <admin@rusnames.ru>
    биз.рус
    ком.рус
    крым.рус
    мир.рус
    мск.рус
    орг.рус
    самара.рус
    сочи.рус
    спб.рус
    я.рус

    // Salesforce.com, Inc. https://salesforce.com/
    // Submitted by Michael Biven <mbiven@salesforce.com>
    *.builder.code.com
    *.dev-builder.code.com
    *.stg-builder.code.com

    // Sandstorm Development Group, Inc. : https://sandcats.io/
    // Submitted by Asheesh Laroia <asheesh@sandstorm.io>
    sandcats.io

    // SBE network solutions GmbH : https://www.sbe.de/
    // Submitted by Norman Meilick <nm@sbe.de>
    logoip.de
    logoip.com

    // Scaleway : https://www.scaleway.com/
    // Submitted by Rémy Léone <rleone@scaleway.com>
    fr-par-1.baremetal.scw.cloud
    fr-par-2.baremetal.scw.cloud
    nl-ams-1.baremetal.scw.cloud
    fnc.fr-par.scw.cloud
    functions.fnc.fr-par.scw.cloud
    k8s.fr-par.scw.cloud
    nodes.k8s.fr-par.scw.cloud
    s3.fr-par.scw.cloud
    s3-website.fr-par.scw.cloud
    whm.fr-par.scw.cloud
    priv.instances.scw.cloud
    pub.instances.scw.cloud
    k8s.scw.cloud
    k8s.nl-ams.scw.cloud
    nodes.k8s.nl-ams.scw.cloud
    s3.nl-ams.scw.cloud
    s3-website.nl-ams.scw.cloud
    whm.nl-ams.scw.cloud
    k8s.pl-waw.scw.cloud
    nodes.k8s.pl-waw.scw.cloud
    s3.pl-waw.scw.cloud
    s3-website.pl-waw.scw.cloud
    scalebook.scw.cloud
    smartlabeling.scw.cloud
    dedibox.fr

    // schokokeks.org GbR : https://schokokeks.org/
    // Submitted by Hanno Böck <hanno@schokokeks.org>
    schokokeks.net

    // Scottish Government: https://www.gov.scot
    // Submitted by Martin Ellis <martin.ellis@gov.scot>
    gov.scot
    service.gov.scot

    // Scry Security : http://www.scrysec.com
    // Submitted by Shante Adam <shante@skyhat.io>
    scrysec.com

    // Securepoint GmbH : https://www.securepoint.de
    // Submitted by Erik Anders <erik.anders@securepoint.de>
    firewall-gateway.com
    firewall-gateway.de
    my-gateway.de
    my-router.de
    spdns.de
    spdns.eu
    firewall-gateway.net
    my-firewall.org
    myfirewall.org
    spdns.org

    // Seidat : https://www.seidat.com
    // Submitted by Artem Kondratev <accounts@seidat.com>
    seidat.net

    // Sellfy : https://sellfy.com
    // Submitted by Yuriy Romadin <contact@sellfy.com>
    sellfy.store

    // Senseering GmbH : https://www.senseering.de
    // Submitted by Felix Mönckemeyer <f.moenckemeyer@senseering.de>
    senseering.net

    // Sendmsg: https://www.sendmsg.co.il
    // Submitted by Assaf Stern <domains@comstar.co.il>
    minisite.ms

    // Service Magnet : https://myservicemagnet.com
    // Submitted by Dave Sanders <dave@myservicemagnet.com>
    magnet.page

    // Service Online LLC : http://drs.ua/
    // Submitted by Serhii Bulakh <support@drs.ua>
    biz.ua
    co.ua
    pp.ua

    // Shift Crypto AG : https://shiftcrypto.ch
    // Submitted by alex <alex@shiftcrypto.ch>
    shiftcrypto.dev
    shiftcrypto.io

    // ShiftEdit : https://shiftedit.net/
    // Submitted by Adam Jimenez <adam@shiftcreate.com>
    shiftedit.io

    // Shopblocks : http://www.shopblocks.com/
    // Submitted by Alex Bowers <alex@shopblocks.com>
    myshopblocks.com

    // Shopify : https://www.shopify.com
    // Submitted by Alex Richter <alex.richter@shopify.com>
    myshopify.com

    // Shopit : https://www.shopitcommerce.com/
    // Submitted by Craig McMahon <craig@shopitcommerce.com>
    shopitsite.com

    // shopware AG : https://shopware.com
    // Submitted by Jens Küper <cloud@shopware.com>
    shopware.store

    // Siemens Mobility GmbH
    // Submitted by Oliver Graebner <security@mo-siemens.io>
    mo-siemens.io

    // SinaAppEngine : http://sae.sina.com.cn/
    // Submitted by SinaAppEngine <saesupport@sinacloud.com>
    1kapp.com
    appchizi.com
    applinzi.com
    sinaapp.com
    vipsinaapp.com

    // Siteleaf : https://www.siteleaf.com/
    // Submitted by Skylar Challand <support@siteleaf.com>
    siteleaf.net

    // Skyhat : http://www.skyhat.io
    // Submitted by Shante Adam <shante@skyhat.io>
    bounty-full.com
    alpha.bounty-full.com
    beta.bounty-full.com

    // Small Technology Foundation : https://small-tech.org
    // Submitted by Aral Balkan <aral@small-tech.org>
    small-web.org

    // Smoove.io : https://www.smoove.io/
    // Submitted by Dan Kozak <dan@smoove.io>
    vp4.me

    // Snowflake Inc : https://www.snowflake.com/
    // Submitted by Faith Olapade <faith.olapade@snowflake.com>
    streamlitapp.com

    // Snowplow Analytics : https://snowplowanalytics.com/
    // Submitted by Ian Streeter <ian@snowplowanalytics.com>
    try-snowplow.com

    // SourceHut : https://sourcehut.org
    // Submitted by Drew DeVault <sir@cmpwn.com>
    srht.site

    // Stackhero : https://www.stackhero.io
    // Submitted by Adrien Gillon <adrien+public-suffix-list@stackhero.io>
    stackhero-network.com

    // Staclar : https://staclar.com
    // Submitted by Q Misell <q@staclar.com>
    musician.io
    // Submitted by Matthias Merkel <matthias.merkel@staclar.com>
    novecore.site

    // staticland : https://static.land
    // Submitted by Seth Vincent <sethvincent@gmail.com>
    static.land
    dev.static.land
    sites.static.land

    // Storebase : https://www.storebase.io
    // Submitted by Tony Schirmer <tony@storebase.io>
    storebase.store

    // Strategic System Consulting (eApps Hosting): https://www.eapps.com/
    // Submitted by Alex Oancea <aoancea@cloudscale365.com>
    vps-host.net
    atl.jelastic.vps-host.net
    njs.jelastic.vps-host.net
    ric.jelastic.vps-host.net

    // Sony Interactive Entertainment LLC : https://sie.com/
    // Submitted by David Coles <david.coles@sony.com>
    playstation-cloud.com

    // SourceLair PC : https://www.sourcelair.com
    // Submitted by Antonis Kalipetis <akalipetis@sourcelair.com>
    apps.lair.io
    *.stolos.io

    // SpaceKit : https://www.spacekit.io/
    // Submitted by Reza Akhavan <spacekit.io@gmail.com>
    spacekit.io

    // SpeedPartner GmbH: https://www.speedpartner.de/
    // Submitted by Stefan Neufeind <info@speedpartner.de>
    customer.speedpartner.de

    // Spreadshop (sprd.net AG) : https://www.spreadshop.com/
    // Submitted by Martin Breest <security@spreadshop.com>
    myspreadshop.at
    myspreadshop.com.au
    myspreadshop.be
    myspreadshop.ca
    myspreadshop.ch
    myspreadshop.com
    myspreadshop.de
    myspreadshop.dk
    myspreadshop.es
    myspreadshop.fi
    myspreadshop.fr
    myspreadshop.ie
    myspreadshop.it
    myspreadshop.net
    myspreadshop.nl
    myspreadshop.no
    myspreadshop.pl
    myspreadshop.se
    myspreadshop.co.uk

    // Standard Library : https://stdlib.com
    // Submitted by Jacob Lee <jacob@stdlib.com>
    api.stdlib.com

    // Storj Labs Inc. : https://storj.io/
    // Submitted by Philip Hutchins <hostmaster@storj.io>
    storj.farm

    // Studenten Net Twente : http://www.snt.utwente.nl/
    // Submitted by Silke Hofstra <syscom@snt.utwente.nl>
    utwente.io

    // Student-Run Computing Facility : https://www.srcf.net/
    // Submitted by Edwin Balani <sysadmins@srcf.net>
    soc.srcf.net
    user.srcf.net

    // Sub 6 Limited: http://www.sub6.com
    // Submitted by Dan Miller <dm@sub6.com>
    temp-dns.com

    // Supabase : https://supabase.io
    // Submitted by Inian Parameshwaran <security@supabase.io>
    supabase.co
    supabase.in
    supabase.net
    su.paba.se

    // Symfony, SAS : https://symfony.com/
    // Submitted by Fabien Potencier <fabien@symfony.com>
    *.s5y.io
    *.sensiosite.cloud

    // Syncloud : https://syncloud.org
    // Submitted by Boris Rybalkin <syncloud@syncloud.it>
    syncloud.it

    // Synology, Inc. : https://www.synology.com/
    // Submitted by Rony Weng <ronyweng@synology.com>
    dscloud.biz
    direct.quickconnect.cn
    dsmynas.com
    familyds.com
    diskstation.me
    dscloud.me
    i234.me
    myds.me
    synology.me
    dscloud.mobi
    dsmynas.net
    familyds.net
    dsmynas.org
    familyds.org
    vpnplus.to
    direct.quickconnect.to

    // Tabit Technologies Ltd. : https://tabit.cloud/
    // Submitted by Oren Agiv <oren@tabit.cloud>
    tabitorder.co.il
    mytabit.co.il
    mytabit.com

    // TAIFUN Software AG : http://taifun-software.de
    // Submitted by Bjoern Henke <dev-server@taifun-software.de>
    taifun-dns.de

    // Tailscale Inc. : https://www.tailscale.com
    // Submitted by David Anderson <danderson@tailscale.com>
    beta.tailscale.net
    ts.net

    // TASK geographical domains (www.task.gda.pl/uslugi/dns)
    gda.pl
    gdansk.pl
    gdynia.pl
    med.pl
    sopot.pl

    // team.blue https://team.blue
    // Submitted by Cedric Dubois <cedric.dubois@team.blue>
    site.tb-hosting.com

    // Teckids e.V. : https://www.teckids.org
    // Submitted by Dominik George <dominik.george@teckids.org>
    edugit.io
    s3.teckids.org

    // Telebit : https://telebit.cloud
    // Submitted by AJ ONeal <aj@telebit.cloud>
    telebit.app
    telebit.io
    *.telebit.xyz

    // Thingdust AG : https://thingdust.com/
    // Submitted by Adrian Imboden <adi@thingdust.com>
    *.firenet.ch
    *.svc.firenet.ch
    reservd.com
    thingdustdata.com
    cust.dev.thingdust.io
    cust.disrec.thingdust.io
    cust.prod.thingdust.io
    cust.testing.thingdust.io
    reservd.dev.thingdust.io
    reservd.disrec.thingdust.io
    reservd.testing.thingdust.io

    // ticket i/O GmbH : https://ticket.io
    // Submitted by Christian Franke <it@ticket.io>
    tickets.io

    // Tlon.io : https://tlon.io
    // Submitted by Mark Staarink <mark@tlon.io>
    arvo.network
    azimuth.network
    tlon.network

    // Tor Project, Inc. : https://torproject.org
    // Submitted by Antoine Beaupré <anarcat@torproject.org
    torproject.net
    pages.torproject.net

    // TownNews.com : http://www.townnews.com
    // Submitted by Dustin Ward <dward@townnews.com>
    bloxcms.com
    townnews-staging.com

    // TrafficPlex GmbH : https://www.trafficplex.de/
    // Submitted by Phillipp Röll <phillipp.roell@trafficplex.de>
    12hp.at
    2ix.at
    4lima.at
    lima-city.at
    12hp.ch
    2ix.ch
    4lima.ch
    lima-city.ch
    trafficplex.cloud
    de.cool
    12hp.de
    2ix.de
    4lima.de
    lima-city.de
    1337.pictures
    clan.rip
    lima-city.rocks
    webspace.rocks
    lima.zone

    // TransIP : https://www.transip.nl
    // Submitted by Rory Breuk <rbreuk@transip.nl>
    *.transurl.be
    *.transurl.eu
    *.transurl.nl

    // TransIP: https://www.transip.nl
    // Submitted by Cedric Dubois <cedric.dubois@team.blue>
    site.transip.me

    // TuxFamily : http://tuxfamily.org
    // Submitted by TuxFamily administrators <adm@staff.tuxfamily.org>
    tuxfamily.org

    // TwoDNS : https://www.twodns.de/
    // Submitted by TwoDNS-Support <support@two-dns.de>
    dd-dns.de
    diskstation.eu
    diskstation.org
    dray-dns.de
    draydns.de
    dyn-vpn.de
    dynvpn.de
    mein-vigor.de
    my-vigor.de
    my-wan.de
    syno-ds.de
    synology-diskstation.de
    synology-ds.de

    // Typedream : https://typedream.com
    // Submitted by Putri Karunia <putri@typedream.com>
    typedream.app

    // Typeform : https://www.typeform.com
    // Submitted by Sergi Ferriz <sergi.ferriz@typeform.com>
    pro.typeform.com

    // Uberspace : https://uberspace.de
    // Submitted by Moritz Werner <mwerner@jonaspasche.com>
    uber.space
    *.uberspace.de

    // UDR Limited : http://www.udr.hk.com
    // Submitted by registry <hostmaster@udr.hk.com>
    hk.com
    hk.org
    ltd.hk
    inc.hk

    // UNIVERSAL DOMAIN REGISTRY : https://www.udr.org.yt/
    // see also: whois -h whois.udr.org.yt help
    // Submitted by Atanunu Igbunuroghene <publicsuffixlist@udr.org.yt>
    name.pm
    sch.tf
    biz.wf
    sch.wf
    org.yt

    // United Gameserver GmbH : https://united-gameserver.de
    // Submitted by Stefan Schwarz <sysadm@united-gameserver.de>
    virtualuser.de
    virtual-user.de

    // Upli : https://upli.io
    // Submitted by Lenny Bakkalian <lenny.bakkalian@gmail.com>
    upli.io

    // urown.net : https://urown.net
    // Submitted by Hostmaster <hostmaster@urown.net>
    urown.cloud
    dnsupdate.info

    // .US
    // Submitted by Ed Moore <Ed.Moore@lib.de.us>
    lib.de.us

    // VeryPositive SIA : http://very.lv
    // Submitted by Danko Aleksejevs <danko@very.lv>
    2038.io

    // Vercel, Inc : https://vercel.com/
    // Submitted by Connor Davis <security@vercel.com>
    vercel.app
    vercel.dev
    now.sh

    // Viprinet Europe GmbH : http://www.viprinet.com
    // Submitted by Simon Kissel <hostmaster@viprinet.com>
    router.management

    // Virtual-Info : https://www.virtual-info.info/
    // Submitted by Adnan RIHAN <hostmaster@v-info.info>
    v-info.info

    // Voorloper.com: https://voorloper.com
    // Submitted by Nathan van Bakel <info@voorloper.com>
    voorloper.cloud

    // Voxel.sh DNS : https://voxel.sh/dns/
    // Submitted by Mia Rehlinger <dns@voxel.sh>
    neko.am
    nyaa.am
    be.ax
    cat.ax
    es.ax
    eu.ax
    gg.ax
    mc.ax
    us.ax
    xy.ax
    nl.ci
    xx.gl
    app.gp
    blog.gt
    de.gt
    to.gt
    be.gy
    cc.hn
    blog.kg
    io.kg
    jp.kg
    tv.kg
    uk.kg
    us.kg
    de.ls
    at.md
    de.md
    jp.md
    to.md
    indie.porn
    vxl.sh
    ch.tc
    me.tc
    we.tc
    nyan.to
    at.vg
    blog.vu
    dev.vu
    me.vu

    // V.UA Domain Administrator : https://domain.v.ua/
    // Submitted by Serhii Rostilo <sergey@rostilo.kiev.ua>
    v.ua

    // Vultr Objects : https://www.vultr.com/products/object-storage/
    // Submitted by Niels Maumenee <storage@vultr.com>
    *.vultrobjects.com

    // Waffle Computer Inc., Ltd. : https://docs.waffleinfo.com
    // Submitted by Masayuki Note <masa@blade.wafflecell.com>
    wafflecell.com

    // WebHare bv: https://www.webhare.com/
    // Submitted by Arnold Hendriks <info@webhare.com>
    *.webhare.dev

    // WebHotelier Technologies Ltd: https://www.webhotelier.net/
    // Submitted by Apostolos Tsakpinis <apostolos.tsakpinis@gmail.com>
    reserve-online.net
    reserve-online.com
    bookonline.app
    hotelwithflight.com

    // WeDeploy by Liferay, Inc. : https://www.wedeploy.com
    // Submitted by Henrique Vicente <security@wedeploy.com>
    wedeploy.io
    wedeploy.me
    wedeploy.sh

    // Western Digital Technologies, Inc : https://www.wdc.com
    // Submitted by Jung Jin <jungseok.jin@wdc.com>
    remotewd.com

    // WIARD Enterprises : https://wiardweb.com
    // Submitted by Kidd Hustle <kiddhustle@wiardweb.com>
    pages.wiardweb.com

    // Wikimedia Labs : https://wikitech.wikimedia.org
    // Submitted by Arturo Borrero Gonzalez <aborrero@wikimedia.org>
    wmflabs.org
    toolforge.org
    wmcloud.org

    // WISP : https://wisp.gg
    // Submitted by Stepan Fedotov <stepan@wisp.gg>
    panel.gg
    daemon.panel.gg

    // Wizard Zines : https://wizardzines.com
    // Submitted by Julia Evans <julia@wizardzines.com>
    messwithdns.com

    // WoltLab GmbH : https://www.woltlab.com
    // Submitted by Tim Düsterhus <security@woltlab.cloud>
    woltlab-demo.com
    myforum.community
    community-pro.de
    diskussionsbereich.de
    community-pro.net
    meinforum.net

    // Woods Valldata : https://www.woodsvalldata.co.uk/
    // Submitted by Chris Whittle <chris.whittle@woodsvalldata.co.uk>
    affinitylottery.org.uk
    raffleentry.org.uk
    weeklylottery.org.uk

    // WP Engine : https://wpengine.com/
    // Submitted by Michael Smith <michael.smith@wpengine.com>
    // Submitted by Brandon DuRette <brandon.durette@wpengine.com>
    wpenginepowered.com
    js.wpenginepowered.com

    // Wix.com, Inc. : https://www.wix.com
    // Submitted by Shahar Talmi <shahar@wix.com>
    wixsite.com
    editorx.io

    // XenonCloud GbR: https://xenoncloud.net
    // Submitted by Julian Uphoff <publicsuffixlist@xenoncloud.net>
    half.host

    // XnBay Technology : http://www.xnbay.com/
    // Submitted by XnBay Developer <developer.xncloud@gmail.com>
    xnbay.com
    u2.xnbay.com
    u2-local.xnbay.com

    // XS4ALL Internet bv : https://www.xs4all.nl/
    // Submitted by Daniel Mostertman <unixbeheer+publicsuffix@xs4all.net>
    cistron.nl
    demon.nl
    xs4all.space

    // Yandex.Cloud LLC: https://cloud.yandex.com
    // Submitted by Alexander Lodin <security+psl@yandex-team.ru>
    yandexcloud.net
    storage.yandexcloud.net
    website.yandexcloud.net

    // YesCourse Pty Ltd : https://yescourse.com
    // Submitted by Atul Bhouraskar <atul@yescourse.com>
    official.academy

    // Yola : https://www.yola.com/
    // Submitted by Stefano Rivera <stefano@yola.com>
    yolasite.com

    // Yombo : https://yombo.net
    // Submitted by Mitch Schwenk <mitch@yombo.net>
    ybo.faith
    yombo.me
    homelink.one
    ybo.party
    ybo.review
    ybo.science
    ybo.trade

    // Yunohost : https://yunohost.org
    // Submitted by Valentin Grimaud <security@yunohost.org>
    ynh.fr
    nohost.me
    noho.st

    // ZaNiC : http://www.za.net/
    // Submitted by registry <hostmaster@nic.za.net>
    za.net
    za.org

    // Zine EOOD : https://zine.bg/
    // Submitted by Martin Angelov <martin@zine.bg>
    bss.design

    // Zitcom A/S : https://www.zitcom.dk
    // Submitted by Emil Stahl <esp@zitcom.dk>
    basicserver.io
    virtualserver.io
    enterprisecloud.nu

    // ===END PRIVATE DOMAINS===

`;
  class Utils {
    constructor() {
      this.pslInitialised = false;
    }
    /*******************************************
    / General utility functions
    /*******************************************/
    versionAsInt(versionArray) {
      let value = 0;
      for (let i = 0; i < versionArray.length; i++) {
        value = value * 256 + versionArray[i];
      }
      return value;
    }
    versionAsArray(versionInt) {
      const byteArray = [0, 0, 0];
      for (let i = byteArray.length - 1; i >= 0; i--) {
        const byte = versionInt & 255;
        byteArray[i] = byte;
        versionInt = (versionInt - byte) / 256;
      }
      return byteArray;
    }
    versionAsString(versionInt) {
      let value = "";
      const versionArray = this.versionAsArray(versionInt);
      for (let i = 0; i < versionArray.length; i++) {
        if (i > 0)
          value += ".";
        value += versionArray[i].toString();
      }
      return value;
    }
    // return the two-digit hexadecimal code for a byte
    toHexString(charCode) {
      return ("0" + charCode.toString(16)).slice(-2);
    }
    BigIntFromRandom(byteCount) {
      const bytes = new Uint8Array(byteCount);
      window.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(this.toHexString).join("");
      return BigInteger.parse(hex, 16);
    }
    // input can be either UTF8 formatted string or a byte array
    hash(data, outFormat = "hex", algorithm = "SHA-256") {
      let inBuffer;
      if (typeof data == "string")
        inBuffer = new TextEncoder().encode(data);
      else
        inBuffer = data;
      return crypto.subtle.digest({ name: algorithm }, inBuffer).then((outBuffer) => {
        if (outFormat == "base64") {
          return utils.byteArrayToBase64(outBuffer);
        } else {
          return Array.from(new Uint8Array(outBuffer)).map(this.toHexString).join("");
        }
      });
    }
    intToByteArray(int) {
      const byteArray = [0, 0, 0, 0];
      for (let index = byteArray.length - 1; index >= 0; index--) {
        const byte = int & 255;
        byteArray[index] = byte;
        int = (int - byte) / 256;
      }
      return byteArray;
    }
    intArrayToByteArray(intArray) {
      const byteArray = new Array(intArray.length * 4);
      for (let index = 0; index < intArray.length; index++) {
        let int = intArray[index];
        for (let j = 3; j >= 0; j--) {
          const byte = int & 255;
          byteArray[index * 4 + j] = byte;
          int = (int - byte) / 256;
        }
      }
      return byteArray;
    }
    stringToByteArray(str) {
      const e = new TextEncoder();
      return e.encode(str);
    }
    // A variation of base64toByteArray which allows us to calculate a HMAC far
    // more efficiently than with seperate memory buffers
    base64toByteArrayForHMAC(input, extraLength, view = null) {
      const binary = atob(input);
      const len = binary.length;
      let offset = 0;
      if (!view) {
        const buffer = new ArrayBuffer(len + extraLength);
        view = new Uint8Array(buffer);
        offset = 20;
      }
      for (let i = 0; i < len; i++) {
        view[i + offset] = binary.charCodeAt(i);
      }
      return view;
    }
    base64toByteArray(input) {
      const binary = atob(input);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
      }
      return view;
    }
    byteArrayToBase64(arrayBuffer) {
      let base64 = "";
      const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const bytes = new Uint8Array(arrayBuffer);
      const byteLength = bytes.byteLength;
      const byteRemainder = byteLength % 3;
      const mainLength = byteLength - byteRemainder;
      let a;
      let b;
      let c;
      let d;
      let chunk;
      for (let i = 0; i < mainLength; i = i + 3) {
        chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
        a = (chunk & 16515072) >> 18;
        b = (chunk & 258048) >> 12;
        c = (chunk & 4032) >> 6;
        d = chunk & 63;
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
      }
      if (byteRemainder == 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2;
        b = (chunk & 3) << 4;
        base64 += encodings[a] + encodings[b] + "==";
      } else if (byteRemainder == 2) {
        chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10;
        b = (chunk & 1008) >> 4;
        c = (chunk & 15) << 2;
        base64 += encodings[a] + encodings[b] + encodings[c] + "=";
      }
      return base64;
    }
    hexStringToByteArray(hexString, byteArray = null) {
      if (hexString.length % 2 !== 0) {
        throw Error("Must have an even number of hex digits to convert to bytes");
      }
      const numBytes = hexString.length / 2;
      if (!byteArray)
        byteArray = new Uint8Array(numBytes);
      for (let i = 0; i < numBytes; i++) {
        byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
      return byteArray;
    }
    newGUID() {
      const lut = [];
      for (let i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? "0" : "") + i.toString(16);
      }
      const dvals = new Uint32Array(4);
      window.crypto.getRandomValues(dvals);
      const d0 = dvals[0];
      const d1 = dvals[1];
      const d2 = dvals[2];
      const d3 = dvals[3];
      return lut[d0 & 255] + lut[d0 >> 8 & 255] + lut[d0 >> 16 & 255] + lut[d0 >> 24 & 255] + "-" + lut[d1 & 255] + lut[d1 >> 8 & 255] + "-" + lut[d1 >> 16 & 15 | 64] + lut[d1 >> 24 & 255] + "-" + lut[d2 & 63 | 128] + lut[d2 >> 8 & 255] + "-" + lut[d2 >> 16 & 255] + lut[d2 >> 24 & 255] + lut[d3 & 255] + lut[d3 >> 8 & 255] + lut[d3 >> 16 & 255] + lut[d3 >> 24 & 255];
    }
    base64urlDecode(input) {
      return atob(input.replace(/-/g, "+").replace(/_/g, "/"));
    }
    binaryToByteArray(binary) {
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
      }
      return view;
    }
    base64urltoByteArray(input) {
      const binary = this.base64urlDecode(input);
      return this.binaryToByteArray(binary);
    }
    get psl() {
      if (!publicSuffixList)
        throw new Error("publicSuffixList library not present");
      if (!this.pslInitialised) {
        publicSuffixList.parse(pslData, punycode.toASCII);
        this.pslInitialised = true;
      }
      return publicSuffixList;
    }
  }
  const utils = new Utils();
  const list = [
    // Native ES errors https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    // Built-in errors
    globalThis.DOMException,
    // Node-specific errors
    // https://nodejs.org/api/errors.html
    globalThis.AssertionError,
    globalThis.SystemError
  ].filter(Boolean).map(
    (constructor) => [constructor.name, constructor]
  );
  const errorConstructors = new Map(list);
  const commonProperties = [
    {
      property: "name",
      enumerable: false
    },
    {
      property: "message",
      enumerable: false
    },
    {
      property: "stack",
      enumerable: false
    },
    {
      property: "code",
      enumerable: true
    },
    {
      property: "cause",
      enumerable: false
    }
  ];
  const toJsonWasCalled = /* @__PURE__ */ new WeakSet();
  const toJSON = (from) => {
    toJsonWasCalled.add(from);
    const json = from.toJSON();
    toJsonWasCalled.delete(from);
    return json;
  };
  const getErrorConstructor = (name) => errorConstructors.get(name) ?? Error;
  const destroyCircular = ({
    from,
    seen,
    to,
    forceEnumerable,
    maxDepth,
    depth,
    useToJSON,
    serialize
  }) => {
    if (!to) {
      if (Array.isArray(from)) {
        to = [];
      } else if (!serialize && isErrorLike(from)) {
        const Error2 = getErrorConstructor(from.name);
        to = new Error2();
      } else {
        to = {};
      }
    }
    seen.push(from);
    if (depth >= maxDepth) {
      return to;
    }
    if (useToJSON && typeof from.toJSON === "function" && !toJsonWasCalled.has(from)) {
      return toJSON(from);
    }
    const continueDestroyCircular = (value) => destroyCircular({
      from: value,
      seen: [...seen],
      forceEnumerable,
      maxDepth,
      depth,
      useToJSON,
      serialize
    });
    for (const [key, value] of Object.entries(from)) {
      if (typeof Buffer === "function" && Buffer.isBuffer(value)) {
        to[key] = "[object Buffer]";
        continue;
      }
      if (value !== null && typeof value === "object" && typeof value.pipe === "function") {
        to[key] = "[object Stream]";
        continue;
      }
      if (typeof value === "function") {
        continue;
      }
      if (!value || typeof value !== "object") {
        to[key] = value;
        continue;
      }
      if (!seen.includes(from[key])) {
        depth++;
        to[key] = continueDestroyCircular(from[key]);
        continue;
      }
      to[key] = "[Circular]";
    }
    for (const { property, enumerable } of commonProperties) {
      if (typeof from[property] !== "undefined" && from[property] !== null) {
        Object.defineProperty(to, property, {
          value: isErrorLike(from[property]) ? continueDestroyCircular(from[property]) : from[property],
          enumerable: forceEnumerable ? true : enumerable,
          configurable: true,
          writable: true
        });
      }
    }
    return to;
  };
  function serializeError(value, options = {}) {
    const {
      maxDepth = Number.POSITIVE_INFINITY,
      useToJSON = true
    } = options;
    if (typeof value === "object" && value !== null) {
      return destroyCircular({
        from: value,
        seen: [],
        forceEnumerable: true,
        maxDepth,
        depth: 0,
        useToJSON,
        serialize: true
      });
    }
    if (typeof value === "function") {
      return `[Function: ${value.name ?? "anonymous"}]`;
    }
    return value;
  }
  function isErrorLike(value) {
    return Boolean(value) && typeof value === "object" && "name" in value && "message" in value && "stack" in value;
  }
  class KeeLogger {
    constructor() {
      this.defaultLevel = 2;
      this.outputStarted = false;
      this.config = { logLevel: this.defaultLevel };
    }
    attachConfig(config) {
      this.debug("Logging system config updated at " + Date());
      this.config = config;
    }
    formatMessage(message, e) {
      if (!message && !e)
        return "";
      if (!this.outputStarted) {
        message = "* " + message;
        this.outputStarted = true;
      }
      if (e) {
        const error2 = isErrorLike(e) ? serializeError(e, { maxDepth: 20 }) : e;
        let json;
        try {
          json = JSON.stringify(error2);
        } catch (ex) {
          json = "[not serialisable]";
        }
        message += ` Error: ${json}`;
      }
      return message;
    }
    debug(message) {
      if (this.config.logLevel >= 4) {
        message = this.formatMessage(message);
        if (message.length > 0) {
          console.debug(message);
          this.config.logLevel >= 4 && this.send(4, message);
        }
      }
    }
    info(message) {
      if (this.config.logLevel >= 3) {
        message = this.formatMessage(message);
        if (message.length > 0) {
          console.info(message);
          this.config.logLevel >= 4 && this.send(3, message);
        }
      }
    }
    warn(message, e) {
      if (this.config.logLevel >= 2) {
        message = this.formatMessage(message, e);
        if (message.length > 0) {
          console.warn(message);
          this.config.logLevel >= 4 && this.send(2, message);
        }
      }
    }
    error(message, e) {
      if (this.config.logLevel >= 1) {
        message = this.formatMessage(message, e);
        if (message.length > 0) {
          console.error(message);
          this.config.logLevel >= 4 && this.send(1, message);
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    send(logLevel, message) {
    }
    stackTrace() {
      console.groupCollapsed("%c Stack Trace", "color:cream; font-style: normal;");
      console.debug(new Error().stack);
      console.groupEnd();
    }
  }
  const KeeLog = new KeeLogger();
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var browserPolyfill = { exports: {} };
  (function(module, exports) {
    (function(global2, factory) {
      {
        factory(module);
      }
    })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : commonjsGlobal, function(module2) {
      var _a, _b;
      if (!((_b = (_a = globalThis.chrome) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id)) {
        throw new Error("This script should only be loaded in a browser extension.");
      }
      if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
        const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
        const wrapAPIs = (extensionAPIs) => {
          const apiMetadata = {
            "alarms": {
              "clear": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "clearAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "get": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "bookmarks": {
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getChildren": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getRecent": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getSubTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTree": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "browserAction": {
              "disable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "enable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "getBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getBadgeText": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "openPopup": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setBadgeText": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "browsingData": {
              "remove": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "removeCache": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCookies": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeDownloads": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFormData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeHistory": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeLocalStorage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePasswords": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePluginData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "settings": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "commands": {
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "contextMenus": {
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "cookies": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAllCookieStores": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "set": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "devtools": {
              "inspectedWindow": {
                "eval": {
                  "minArgs": 1,
                  "maxArgs": 2,
                  "singleCallbackArg": false
                }
              },
              "panels": {
                "create": {
                  "minArgs": 3,
                  "maxArgs": 3,
                  "singleCallbackArg": true
                },
                "elements": {
                  "createSidebarPane": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              }
            },
            "downloads": {
              "cancel": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "download": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "erase": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFileIcon": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "open": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "pause": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFile": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "resume": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "extension": {
              "isAllowedFileSchemeAccess": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "isAllowedIncognitoAccess": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "history": {
              "addUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "deleteRange": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getVisits": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "i18n": {
              "detectLanguage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAcceptLanguages": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "identity": {
              "launchWebAuthFlow": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "idle": {
              "queryState": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "management": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getSelf": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setEnabled": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "uninstallSelf": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "notifications": {
              "clear": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPermissionLevel": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "pageAction": {
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "hide": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "permissions": {
              "contains": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "request": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "runtime": {
              "getBackgroundPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPlatformInfo": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "openOptionsPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "requestUpdateCheck": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "sendMessage": {
                "minArgs": 1,
                "maxArgs": 3
              },
              "sendNativeMessage": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "setUninstallURL": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "sessions": {
              "getDevices": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getRecentlyClosed": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "restore": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "storage": {
              "local": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "managed": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "sync": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              }
            },
            "tabs": {
              "captureVisibleTab": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "detectLanguage": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "discard": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "duplicate": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "executeScript": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getZoom": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getZoomSettings": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goBack": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goForward": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "highlight": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "insertCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "query": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "reload": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "sendMessage": {
                "minArgs": 2,
                "maxArgs": 3
              },
              "setZoom": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "setZoomSettings": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "update": {
                "minArgs": 1,
                "maxArgs": 2
              }
            },
            "topSites": {
              "get": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "webNavigation": {
              "getAllFrames": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFrame": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "webRequest": {
              "handlerBehaviorChanged": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "windows": {
              "create": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getLastFocused": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            }
          };
          if (Object.keys(apiMetadata).length === 0) {
            throw new Error("api-metadata.json has not been included in browser-polyfill");
          }
          class DefaultWeakMap extends WeakMap {
            constructor(createItem, items = void 0) {
              super(items);
              this.createItem = createItem;
            }
            get(key) {
              if (!this.has(key)) {
                this.set(key, this.createItem(key));
              }
              return super.get(key);
            }
          }
          const isThenable = (value) => {
            return value && typeof value === "object" && typeof value.then === "function";
          };
          const makeCallback = (promise, metadata) => {
            return (...callbackArgs) => {
              if (extensionAPIs.runtime.lastError) {
                promise.reject(new Error(extensionAPIs.runtime.lastError.message));
              } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                promise.resolve(callbackArgs[0]);
              } else {
                promise.resolve(callbackArgs);
              }
            };
          };
          const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
          const wrapAsyncFunction = (name, metadata) => {
            return function asyncFunctionWrapper(target, ...args) {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                if (metadata.fallbackToNoCallback) {
                  try {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  } catch (cbError) {
                    console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                    target[name](...args);
                    metadata.fallbackToNoCallback = false;
                    metadata.noCallback = true;
                    resolve();
                  }
                } else if (metadata.noCallback) {
                  target[name](...args);
                  resolve();
                } else {
                  target[name](...args, makeCallback({
                    resolve,
                    reject
                  }, metadata));
                }
              });
            };
          };
          const wrapMethod = (target, method, wrapper) => {
            return new Proxy(method, {
              apply(targetMethod, thisObj, args) {
                return wrapper.call(thisObj, target, ...args);
              }
            });
          };
          let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
          const wrapObject = (target, wrappers = {}, metadata = {}) => {
            let cache = /* @__PURE__ */ Object.create(null);
            let handlers = {
              has(proxyTarget2, prop) {
                return prop in target || prop in cache;
              },
              get(proxyTarget2, prop, receiver) {
                if (prop in cache) {
                  return cache[prop];
                }
                if (!(prop in target)) {
                  return void 0;
                }
                let value = target[prop];
                if (typeof value === "function") {
                  if (typeof wrappers[prop] === "function") {
                    value = wrapMethod(target, target[prop], wrappers[prop]);
                  } else if (hasOwnProperty(metadata, prop)) {
                    let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                    value = wrapMethod(target, target[prop], wrapper);
                  } else {
                    value = value.bind(target);
                  }
                } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                  value = wrapObject(value, wrappers[prop], metadata[prop]);
                } else if (hasOwnProperty(metadata, "*")) {
                  value = wrapObject(value, wrappers[prop], metadata["*"]);
                } else {
                  Object.defineProperty(cache, prop, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      return target[prop];
                    },
                    set(value2) {
                      target[prop] = value2;
                    }
                  });
                  return value;
                }
                cache[prop] = value;
                return value;
              },
              set(proxyTarget2, prop, value, receiver) {
                if (prop in cache) {
                  cache[prop] = value;
                } else {
                  target[prop] = value;
                }
                return true;
              },
              defineProperty(proxyTarget2, prop, desc) {
                return Reflect.defineProperty(cache, prop, desc);
              },
              deleteProperty(proxyTarget2, prop) {
                return Reflect.deleteProperty(cache, prop);
              }
            };
            let proxyTarget = Object.create(target);
            return new Proxy(proxyTarget, handlers);
          };
          const wrapEvent = (wrapperMap) => ({
            addListener(target, listener, ...args) {
              target.addListener(wrapperMap.get(listener), ...args);
            },
            hasListener(target, listener) {
              return target.hasListener(wrapperMap.get(listener));
            },
            removeListener(target, listener) {
              target.removeListener(wrapperMap.get(listener));
            }
          });
          const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onRequestFinished(req) {
              const wrappedReq = wrapObject(
                req,
                {},
                {
                  getContent: {
                    minArgs: 0,
                    maxArgs: 0
                  }
                }
              );
              listener(wrappedReq);
            };
          });
          const onMessageWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onMessage(message, sender, sendResponse) {
              let didCallSendResponse = false;
              let wrappedSendResponse;
              let sendResponsePromise = new Promise((resolve) => {
                wrappedSendResponse = function(response) {
                  didCallSendResponse = true;
                  resolve(response);
                };
              });
              let result;
              try {
                result = listener(message, sender, wrappedSendResponse);
              } catch (err) {
                result = Promise.reject(err);
              }
              const isResultThenable = result !== true && isThenable(result);
              if (result !== true && !isResultThenable && !didCallSendResponse) {
                return false;
              }
              const sendPromisedResult = (promise) => {
                promise.then((msg) => {
                  sendResponse(msg);
                }, (error2) => {
                  let message2;
                  if (error2 && (error2 instanceof Error || typeof error2.message === "string")) {
                    message2 = error2.message;
                  } else {
                    message2 = "An unexpected error occurred";
                  }
                  sendResponse({
                    __mozWebExtensionPolyfillReject__: true,
                    message: message2
                  });
                }).catch((err) => {
                  console.error("Failed to send onMessage rejected reply", err);
                });
              };
              if (isResultThenable) {
                sendPromisedResult(result);
              } else {
                sendPromisedResult(sendResponsePromise);
              }
              return true;
            };
          });
          const wrappedSendMessageCallback = ({
            reject,
            resolve
          }, reply) => {
            if (extensionAPIs.runtime.lastError) {
              if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                resolve();
              } else {
                reject(new Error(extensionAPIs.runtime.lastError.message));
              }
            } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
              reject(new Error(reply.message));
            } else {
              resolve(reply);
            }
          };
          const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
            if (args.length < metadata.minArgs) {
              throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
            }
            if (args.length > metadata.maxArgs) {
              throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
            }
            return new Promise((resolve, reject) => {
              const wrappedCb = wrappedSendMessageCallback.bind(null, {
                resolve,
                reject
              });
              args.push(wrappedCb);
              apiNamespaceObj.sendMessage(...args);
            });
          };
          const staticWrappers = {
            devtools: {
              network: {
                onRequestFinished: wrapEvent(onRequestFinishedWrappers)
              }
            },
            runtime: {
              onMessage: wrapEvent(onMessageWrappers),
              onMessageExternal: wrapEvent(onMessageWrappers),
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 1,
                maxArgs: 3
              })
            },
            tabs: {
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 2,
                maxArgs: 3
              })
            }
          };
          const settingMetadata = {
            clear: {
              minArgs: 1,
              maxArgs: 1
            },
            get: {
              minArgs: 1,
              maxArgs: 1
            },
            set: {
              minArgs: 1,
              maxArgs: 1
            }
          };
          apiMetadata.privacy = {
            network: {
              "*": settingMetadata
            },
            services: {
              "*": settingMetadata
            },
            websites: {
              "*": settingMetadata
            }
          };
          return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
        };
        module2.exports = wrapAPIs(chrome);
      } else {
        module2.exports = globalThis.browser;
      }
    });
  })(browserPolyfill);
  var browserPolyfillExports = browserPolyfill.exports;
  const LATEST_VERSION = 8;
  const defaultConfig = new Config();
  defaultConfig.autoFillDialogs = false;
  defaultConfig.autoFillForms = true;
  defaultConfig.autoFillFormsWithMultipleMatches = false;
  defaultConfig.autoSubmitForms = false;
  defaultConfig.autoSubmitDialogs = false;
  defaultConfig.autoSubmitMatchedForms = false;
  defaultConfig.connSLClient = 2;
  defaultConfig.connSLServerMin = 2;
  defaultConfig.keePassDBToOpen = "";
  defaultConfig.keePassMRUDB = "";
  defaultConfig.KeePassRPCWebSocketPort = 12546;
  defaultConfig.KPRPCUsername = "";
  defaultConfig.KPRPCStoredKeys = {};
  defaultConfig.lastConnectedToKeePass = "";
  defaultConfig.listAllOpenDBs = true;
  defaultConfig.logLevel = KeeLog.defaultLevel;
  defaultConfig.logMethodConsole = false;
  defaultConfig.logMethodFile = false;
  defaultConfig.logSensitiveData = false;
  defaultConfig.metricsUsageDisabled = false;
  defaultConfig.metricsUserId = "";
  defaultConfig.notifyWhenEntryUpdated = true;
  defaultConfig.notifyWhenLateDiscovery = false;
  defaultConfig.notifyWhenLoggedOut = false;
  defaultConfig.overWriteFieldsAutomatically = false;
  defaultConfig.rememberMRUDB = true;
  defaultConfig.rememberMRUGroup = true;
  defaultConfig.saveFavicons = true;
  defaultConfig.searchAllOpenDBs = true;
  defaultConfig.config = null;
  defaultConfig.siteConfig = defaultSiteConfig;
  defaultConfig.tutorialProgress = "";
  defaultConfig.version = LATEST_VERSION;
  defaultConfig.triggerChangeInputEventAfterFill = false;
  defaultConfig.autoSubmitNetworkAuthWithSingleMatch = false;
  defaultConfig.searchNetworkAuth = true;
  defaultConfig.notificationCountGeneric = 0;
  defaultConfig.notificationCountSavePassword = 0;
  defaultConfig.currentSearchTermTimeout = 30;
  defaultConfig.notifyPasswordAvailableForPaste = true;
  defaultConfig.animateWhenOfferingSave = true;
  defaultConfig.keeVaultLaunchMessageDismissed = false;
  defaultConfig.keeVaultLaunchStart = 864e13;
  defaultConfig.keeVaultLaunchEnd = 864e13;
  defaultConfig.manualSubmitOverrideProhibited = false;
  defaultConfig.theme = null;
  defaultConfig.hideConfirmationAfterSave = false;
  defaultConfig.mustShowReleaseNotesAtStartup = false;
  defaultConfig.autoFillFieldsWithExistingValue = false;
  class ConfigManager {
    constructor() {
      this.maxCharsPerPage = 1e4;
      this._listeners = [];
      this.current = defaultConfig;
      browserPolyfillExports.storage.onChanged.addListener((a, b) => this.reloadOnStorageChange(a, b));
    }
    // Some processes may want to take action when settings are changed (e.g. the background
    // process to notify the KPRPC server). Using this rather than browser.storage.onChanged.addListener
    // ensures that our configManager data is consistent with the underlying storage
    addChangeListener(listener) {
      this._listeners.push(listener);
    }
    reloadOnStorageChange(changes, area) {
      configManager.reload(() => this._listeners.forEach((listener) => listener(changes, area)));
    }
    async setASAP(values) {
      Object.assign(this.current, values);
      await this.save();
      return;
    }
    splitStringToPages(str) {
      const numPages = Math.ceil(str.length / this.maxCharsPerPage);
      const pages = new Array(numPages);
      for (let i = 0, o = 0; i < numPages; ++i, o += this.maxCharsPerPage) {
        pages[i] = str.substr(o, this.maxCharsPerPage);
      }
      return pages;
    }
    async save() {
      const configString = JSON.stringify(this.current);
      const pages = this.splitStringToPages(configString);
      const configValues = {};
      configValues.keeConfigPageCount = pages.length;
      for (let i = 0; i < pages.length; i++) {
        configValues["keeConfigPage" + i] = pages[i];
      }
      await browserPolyfillExports.storage.local.set(configValues);
    }
    load(onLoaded) {
      browserPolyfillExports.storage.local.get().then((config) => {
        const pageCount = config["keeConfigPageCount"];
        if (pageCount) {
          let configString = "";
          for (let i = 0; i < pageCount; i++) {
            const nextPage = config["keeConfigPage" + i];
            if (nextPage)
              configString += nextPage;
          }
          if (configString)
            this.current = JSON.parse(configString);
        } else {
          const oldPageCount = config["keefoxConfigPageCount"];
          if (oldPageCount) {
            let configString = "";
            for (let i = 0; i < oldPageCount; i++) {
              const nextPage = config["keefoxConfigPage" + i];
              if (nextPage)
                configString += nextPage;
            }
            if (configString)
              this.current = JSON.parse(configString);
          }
        }
        this.fixInvalidConfigData();
        this.migrateToLatestVersion();
        onLoaded();
      });
    }
    // This is typically invalid due to the previous execution of alpha and beta code
    // on the user's system but whatever the reason, the items here are especially hard
    // to fix through the UI and critical to Kee functionality so we take no chances
    fixInvalidConfigData() {
      let saveNeeded = false;
      if (this.current.KPRPCStoredKeys == null) {
        this.current.KPRPCStoredKeys = {};
        saveNeeded = true;
      }
      if (saveNeeded)
        this.save();
    }
    migrateToLatestVersion() {
      if (this.current.version >= LATEST_VERSION)
        return;
      const migrations = new ConfigMigrations();
      switch (this.current.version) {
        case 1:
          migrations.migrateToVersion2(this.current);
        case 2:
          migrations.migrateToVersion3(this.current);
        case 3:
          migrations.migrateToVersion4(this.current);
        case 4:
          migrations.migrateToVersion5(this.current);
        case 5:
          migrations.migrateToVersion6(this.current);
        case 6:
          migrations.migrateToVersion7(this.current);
        case 7:
          migrations.migrateToVersion8(this.current);
      }
      this.save();
    }
    migrateFromRemoteToLatestVersion() {
      if (this.current.version >= LATEST_VERSION)
        return;
      const migrations = new ConfigMigrations();
      switch (this.current.version) {
        case 5:
          migrations.migrateToVersion6(this.current);
        case 6:
          migrations.migrateToVersion7(this.current);
      }
      this.save();
    }
    reload(onLoaded) {
      browserPolyfillExports.storage.local.get().then((config) => {
        const pageCount = config["keeConfigPageCount"];
        if (pageCount) {
          let configString = "";
          for (let i = 0; i < pageCount; i++) {
            const nextPage = config["keeConfigPage" + i];
            if (nextPage)
              configString += nextPage;
          }
          if (configString) {
            this.current = Object.assign(this.current, JSON.parse(configString));
          }
        }
        if (onLoaded)
          onLoaded();
      });
    }
    siteConfigLookupFor(target, method) {
      if (target == "Domain") {
        if (method == "Exact") {
          if (!this.current.siteConfig.domainExact) {
            this.current.siteConfig.domainExact = new SiteConfigLookup();
          }
          return this.current.siteConfig.domainExact;
        }
        if (method == "Prefix") {
          if (!this.current.siteConfig.domainPrefix) {
            this.current.siteConfig.domainPrefix = new SiteConfigLookup();
          }
          return this.current.siteConfig.domainPrefix;
        }
        if (method == "Regex") {
          if (!this.current.siteConfig.domainRegex) {
            this.current.siteConfig.domainRegex = new SiteConfigLookup();
          }
          return this.current.siteConfig.domainRegex;
        }
      } else if (target == "Host") {
        if (method == "Exact") {
          if (!this.current.siteConfig.hostExact) {
            this.current.siteConfig.hostExact = new SiteConfigLookup();
          }
          return this.current.siteConfig.hostExact;
        }
        if (method == "Prefix") {
          if (!this.current.siteConfig.hostPrefix) {
            this.current.siteConfig.hostPrefix = new SiteConfigLookup();
          }
          return this.current.siteConfig.hostPrefix;
        }
        if (method == "Regex") {
          if (!this.current.siteConfig.hostRegex) {
            this.current.siteConfig.hostRegex = new SiteConfigLookup();
          }
          return this.current.siteConfig.hostRegex;
        }
      } else if (target == "Page") {
        if (method == "Exact") {
          if (!this.current.siteConfig.pageExact) {
            this.current.siteConfig.pageExact = new SiteConfigLookup();
          }
          return this.current.siteConfig.pageExact;
        }
        if (method == "Prefix") {
          if (!this.current.siteConfig.pagePrefix) {
            this.current.siteConfig.pagePrefix = new SiteConfigLookup();
          }
          return this.current.siteConfig.pagePrefix;
        }
        if (method == "Regex") {
          if (!this.current.siteConfig.pageRegex) {
            this.current.siteConfig.pageRegex = new SiteConfigLookup();
          }
          return this.current.siteConfig.pageRegex;
        }
      }
      return null;
    }
    siteConfigFor(url) {
      const matchedConfigNodes = this.findAllConfigsFor(url);
      matchedConfigNodes.sort((node1, node2) => node2.matchWeight - node1.matchWeight);
      return this.deriveConfigFromMatches(matchedConfigNodes);
    }
    findAllConfigsFor(urlString) {
      const matchedConfigNodes = [];
      const url = new URL(urlString);
      const host = url.host;
      const page = host + url.pathname;
      const domain = utils.psl.getDomain(host);
      for (const value in this.current.siteConfig.domainExact) {
        if (value === domain) {
          matchedConfigNodes.push(this.current.siteConfig.domainExact[value]);
        }
      }
      for (const value in this.current.siteConfig.hostExact) {
        if (value === host) {
          matchedConfigNodes.push(this.current.siteConfig.hostExact[value]);
        }
      }
      for (const value in this.current.siteConfig.pageExact) {
        if (value === page) {
          matchedConfigNodes.push(this.current.siteConfig.pageExact[value]);
        }
      }
      for (const value in this.current.siteConfig.domainPrefix) {
        if (domain.startsWith(value)) {
          matchedConfigNodes.push(this.current.siteConfig.domainPrefix[value]);
        }
      }
      for (const value in this.current.siteConfig.hostPrefix) {
        if (host.startsWith(value)) {
          matchedConfigNodes.push(this.current.siteConfig.hostPrefix[value]);
        }
      }
      for (const value in this.current.siteConfig.pagePrefix) {
        if (page.startsWith(value)) {
          matchedConfigNodes.push(this.current.siteConfig.pagePrefix[value]);
        }
      }
      for (const value in this.current.siteConfig.domainRegex) {
        if (new RegExp(value).test(domain)) {
          matchedConfigNodes.push(this.current.siteConfig.domainRegex[value]);
        }
      }
      for (const value in this.current.siteConfig.hostRegex) {
        if (new RegExp(value).test(host)) {
          matchedConfigNodes.push(this.current.siteConfig.hostRegex[value]);
        }
      }
      for (const value in this.current.siteConfig.pageRegex) {
        if (new RegExp(value).test(page)) {
          matchedConfigNodes.push(this.current.siteConfig.pageRegex[value]);
        }
      }
      return matchedConfigNodes;
    }
    findAllConfigsAndIndexFor(urlString) {
      const matchedConfigNodesAndIndexes = [];
      const url = new URL(urlString);
      const host = url.host;
      const page = host + url.pathname;
      const domain = utils.psl.getDomain(host);
      for (const value in this.current.siteConfig.domainExact) {
        if (value === domain) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.domainExact[value],
            target: "Domain",
            method: "Exact",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.hostExact) {
        if (value === host) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.hostExact[value],
            target: "Host",
            method: "Exact",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.pageExact) {
        if (value === page) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.pageExact[value],
            target: "Page",
            method: "Exact",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.domainPrefix) {
        if (domain.startsWith(value)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.domainPrefix[value],
            target: "Domain",
            method: "Prefix",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.hostPrefix) {
        if (host.startsWith(value)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.hostPrefix[value],
            target: "Host",
            method: "Prefix",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.pagePrefix) {
        if (page.startsWith(value)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.pagePrefix[value],
            target: "Page",
            method: "Prefix",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.domainRegex) {
        if (new RegExp(value).test(domain)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.domainRegex[value],
            target: "Domain",
            method: "Regex",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.hostRegex) {
        if (new RegExp(value).test(host)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.hostRegex[value],
            target: "Host",
            method: "Regex",
            lookupValue: value
          });
        }
      }
      for (const value in this.current.siteConfig.pageRegex) {
        if (new RegExp(value).test(page)) {
          matchedConfigNodesAndIndexes.push({
            node: this.current.siteConfig.pageRegex[value],
            target: "Page",
            method: "Regex",
            lookupValue: value
          });
        }
      }
      return matchedConfigNodesAndIndexes;
    }
    deriveConfigFromMatches(matchedConfigNodes) {
      const derivedConfig = {};
      matchedConfigNodes.forEach((node) => {
        if (node.config.preventSaveNotification !== void 0 && derivedConfig.preventSaveNotification == null) {
          derivedConfig.preventSaveNotification = node.config.preventSaveNotification;
        }
        if (node.config.listMatchingCaseSensitive !== void 0 && derivedConfig.listMatchingCaseSensitive == null) {
          derivedConfig.listMatchingCaseSensitive = node.config.listMatchingCaseSensitive;
        }
        if (node.config.blackList !== void 0) {
          if (derivedConfig.blackList === void 0) {
            derivedConfig.blackList = {};
          }
          if (node.config.blackList.form !== void 0) {
            if (derivedConfig.blackList.form === void 0) {
              derivedConfig.blackList.form = {};
            }
            if (node.config.blackList.form.ids !== void 0) {
              if (derivedConfig.blackList.form.ids === void 0) {
                derivedConfig.blackList.form.ids = node.config.blackList.form.ids;
              }
            }
            if (node.config.blackList.form.names !== void 0) {
              if (derivedConfig.blackList.form.names === void 0) {
                derivedConfig.blackList.form.names = node.config.blackList.form.names;
              }
            }
          }
          if (node.config.blackList.fields !== void 0) {
            if (derivedConfig.blackList.fields === void 0) {
              derivedConfig.blackList.fields = {};
            }
            if (node.config.blackList.fields.ids !== void 0) {
              if (derivedConfig.blackList.fields.ids === void 0) {
                derivedConfig.blackList.fields.ids = node.config.blackList.fields.ids;
              }
            }
            if (node.config.blackList.fields.names !== void 0) {
              if (derivedConfig.blackList.fields.names === void 0) {
                derivedConfig.blackList.fields.names = node.config.blackList.fields.names;
              }
            }
          }
        }
        if (node.config.whiteList !== void 0) {
          if (derivedConfig.whiteList === void 0) {
            derivedConfig.whiteList = {};
          }
          if (node.config.whiteList.form !== void 0) {
            if (derivedConfig.whiteList.form === void 0) {
              derivedConfig.whiteList.form = {};
            }
            if (node.config.whiteList.form.ids !== void 0) {
              if (derivedConfig.whiteList.form.ids === void 0) {
                derivedConfig.whiteList.form.ids = node.config.whiteList.form.ids;
              }
            }
            if (node.config.whiteList.form.names !== void 0) {
              if (derivedConfig.whiteList.form.names === void 0) {
                derivedConfig.whiteList.form.names = node.config.whiteList.form.names;
              }
            }
          }
          if (node.config.whiteList.fields !== void 0) {
            if (derivedConfig.whiteList.fields === void 0) {
              derivedConfig.whiteList.fields = {};
            }
            if (node.config.whiteList.fields.ids !== void 0) {
              if (derivedConfig.whiteList.fields.ids === void 0) {
                derivedConfig.whiteList.fields.ids = node.config.whiteList.fields.ids;
              }
            }
            if (node.config.whiteList.fields.names !== void 0) {
              if (derivedConfig.whiteList.fields.names === void 0) {
                derivedConfig.whiteList.fields.names = node.config.whiteList.fields.names;
              }
            }
          }
        }
        if (node.config.preferredEntryUuid !== void 0 && derivedConfig.preferredEntryUuid == null) {
          derivedConfig.preferredEntryUuid = node.config.preferredEntryUuid;
        }
      });
      return derivedConfig;
    }
    normalizeFormProperty(input, ic) {
      if (typeof input !== "string")
        return null;
      return ic ? input.toLowerCase() : input;
    }
    isFormInteresting(form, conf, otherFields) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
      function caseAwareMatch(values) {
        return (values || []).map((x) => ic ? x == null ? void 0 : x.toLowerCase() : x).filter(Boolean);
      }
      const ic = conf.listMatchingCaseSensitive !== true;
      const fieldIds = otherFields.map((field) => {
        var _a2, _b2;
        return ic ? (_a2 = field.locators[0]) == null ? void 0 : _a2.id.toLowerCase() : (_b2 = field.locators[0]) == null ? void 0 : _b2.id;
      }).filter(Boolean);
      const fieldNames = otherFields.map((field) => {
        var _a2, _b2;
        return ic ? (_a2 = field.locators[0]) == null ? void 0 : _a2.name.toLowerCase() : (_b2 = field.locators[0]) == null ? void 0 : _b2.name;
      }).filter(Boolean);
      const formId = this.normalizeFormProperty(form.id, ic);
      const formName = this.normalizeFormProperty(form.name, ic);
      const excludeFormIds = caseAwareMatch((_b = (_a = conf == null ? void 0 : conf.blackList) == null ? void 0 : _a.form) == null ? void 0 : _b.ids);
      const excludeFormNames = caseAwareMatch((_d = (_c = conf == null ? void 0 : conf.blackList) == null ? void 0 : _c.form) == null ? void 0 : _d.names);
      const excludeFieldIds = caseAwareMatch((_f = (_e = conf == null ? void 0 : conf.blackList) == null ? void 0 : _e.fields) == null ? void 0 : _f.ids);
      const excludeFieldNames = caseAwareMatch((_h = (_g = conf == null ? void 0 : conf.blackList) == null ? void 0 : _g.fields) == null ? void 0 : _h.names);
      const excluded = excludeFormIds.indexOf(formId) >= 0 || excludeFormNames.indexOf(formName) >= 0 || excludeFieldIds.some((id) => fieldIds.find((i) => id === i) !== void 0) || excludeFieldNames.some((name) => fieldNames.find((n) => name === n) !== void 0);
      if (excluded)
        return false;
      const includeFormIds = caseAwareMatch((_j = (_i = conf == null ? void 0 : conf.whiteList) == null ? void 0 : _i.form) == null ? void 0 : _j.ids);
      const includeFormNames = caseAwareMatch((_l = (_k = conf == null ? void 0 : conf.whiteList) == null ? void 0 : _k.form) == null ? void 0 : _l.names);
      const includeFieldIds = caseAwareMatch((_n = (_m = conf == null ? void 0 : conf.whiteList) == null ? void 0 : _m.fields) == null ? void 0 : _n.ids);
      const includeFieldNames = caseAwareMatch((_p = (_o = conf == null ? void 0 : conf.whiteList) == null ? void 0 : _o.fields) == null ? void 0 : _p.names);
      const included = includeFormIds.indexOf(formId) >= 0 || includeFormNames.indexOf(formName) >= 0 || includeFieldIds.some((id) => fieldIds.find((i) => id === i) !== void 0) || includeFieldNames.some((name) => fieldNames.find((n) => name === n) !== void 0);
      if (included)
        return true;
      return null;
    }
    get activeTheme() {
      return this.current.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    togglePreferredEntryUuid(uuid, urlString) {
      let url;
      try {
        url = new URL(urlString);
      } catch (e) {
        KeeLog.error(
          "Invalid URL supplied to togglePreferredEntryUuid. Preferred entry will not be altered."
        );
        return;
      }
      const configuredTarget = "Domain";
      const allConfigNodesAndLookups = this.findAllConfigsAndIndexFor(urlString);
      const derivedConfig = this.siteConfigFor(urlString);
      const currentPreferredUuid = derivedConfig.preferredEntryUuid;
      if (currentPreferredUuid === uuid) {
        allConfigNodesAndLookups.forEach((cnl) => {
          if (cnl.node.config.preferredEntryUuid === uuid) {
            this.removePreferredEntryUuid(cnl);
          }
        });
      } else {
        allConfigNodesAndLookups.forEach((cnl) => {
          if (cnl.node.config.preferredEntryUuid === currentPreferredUuid && this.leastSpecificTarget(configuredTarget, cnl.target) === configuredTarget) {
            this.removePreferredEntryUuid(cnl);
          }
        });
        this.addSiteConfigParameters(
          { preferredEntryUuid: uuid },
          url,
          configuredTarget,
          "Exact",
          "Auto"
        );
      }
      this.save();
    }
    removePreferredEntryUuid(cnl) {
      cnl.node.config.preferredEntryUuid = null;
      if (cnl.node.source === "Auto" && this.equalsDefaultSiteConfig(cnl.node.config)) {
        const lookup = this.siteConfigLookupFor(cnl.target, cnl.method);
        delete lookup[cnl.lookupValue];
      }
    }
    equalsDefaultSiteConfig(config) {
      if (typeof config.preferredEntryUuid === "boolean")
        return false;
      if (typeof config.preventSaveNotification === "boolean")
        return false;
      if (typeof config.listMatchingCaseSensitive === "boolean")
        return false;
      if (config.whiteList)
        return false;
      if (config.blackList)
        return false;
      return true;
    }
    leastSpecificTarget(t1, t2) {
      if (t1 === "Domain" || t2 === "Domain") {
        return "Domain";
      }
      if (t1 === "Host" || t2 === "Host") {
        return "Host";
      }
      return "Page";
    }
    valueFromUrl(url, target) {
      const host = url.host;
      if (target === "Host")
        return host;
      if (target === "Page")
        return host + url.pathname;
      if (target === "Domain")
        return utils.psl.getDomain(host);
    }
    addSiteConfigParameters(partialConfig, url, target, method, source) {
      const value = this.valueFromUrl(url, target);
      const configLookup = configManager.siteConfigLookupFor(target, method);
      if (!configLookup[value]) {
        configLookup[value] = { config: new SiteConfig(), source, matchWeight: 100 };
      }
      Object.assign(configLookup[value].config, partialConfig);
    }
  }
  const configManager = new ConfigManager();
  class PanelStubOptions {
  }
  PanelStubOptions.MatchedLogins = {
    id: "KeeAddonPanelMatchedLogins",
    height: 300,
    width: 400,
    name: "matchedLoginsLegacy",
    autoCloseTime: 0,
    legacy: true
  };
  PanelStubOptions.GeneratePasswordLegacy = {
    id: "KeeAddonPanelGeneratePassword",
    height: 300,
    width: 400,
    name: "generatePasswordLegacy",
    autoCloseTime: 0,
    legacy: true
  };
  PanelStubOptions.GeneratePassword = {
    id: "KeeAddonPanelGeneratePassword",
    height: 500,
    width: 450,
    name: "generatePassword",
    autoCloseTime: 0,
    legacy: false
  };
  class PanelStub {
    constructor(options, target, parentFrameId) {
      this.target = target;
      this.options = options;
      this.parentFrameId = parentFrameId;
    }
    createPanel() {
      if (this.options.name == "generatePassword") {
        this.elementToRefocus = document.activeElement;
      }
      this.container = document.createElement("div");
      const shadow = this.container.attachShadow({ mode: "closed" });
      this.container.id = this.options.id;
      const style = document.createElement("style");
      style.textContent = `:host(div) {
            display: block !important;
            position: absolute !important;
            z-index: 2147483647 !important;
        }`;
      shadow.appendChild(style);
      if (this.target) {
        this.targetRelativeRect = this.target.getBoundingClientRect();
        this.positionPanel();
      } else {
        this.container.style.setProperty("width", this.options.width + "px", "important");
        this.container.style.setProperty("height", this.options.height + "px", "important");
        this.container.style.setProperty(
          "top",
          (window.innerHeight - this.options.height) / 2 + window.scrollY + "px",
          "important"
        );
        this.container.style.setProperty(
          "left",
          (window.innerWidth - this.options.width) / 2 + window.scrollX + "px",
          "important"
        );
      }
      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      iframe.setAttribute("allow", "");
      iframe.style.setProperty("width", "100%", "important");
      iframe.style.setProperty("height", "100%", "important");
      iframe.style.setProperty("visibility", "visible", "important");
      iframe.style.setProperty("display", "block", "important");
      iframe.style.setProperty("position", "relative", "important");
      iframe.style.setProperty(
        "background-color",
        configManager.activeTheme === "dark" ? "#1e1e1e" : "#ffffff",
        "important"
      );
      iframe.setAttribute("scrolling", "no");
      if (this.options.legacy) {
        iframe.style.setProperty("border", "none", "important");
      } else {
        iframe.style.setProperty("border", "2px solid #1a466b", "important");
        iframe.style.setProperty("border-radius", "8px", "important");
      }
      shadow.appendChild(iframe);
      const template = browserPolyfillExports.extension.getURL(
        `dist/panels/panels${this.options.legacy ? "Legacy" : ""}.html`
      );
      iframe.src = `${template}?parentFrameId=${this.parentFrameId}&autoCloseTime=${this.options.autoCloseTime}&panel=${this.options.name}&theme=${configManager.activeTheme}`;
      const bodyElements = document.getElementsByTagName("body");
      if (bodyElements && bodyElements.length > 0) {
        bodyElements[0].appendChild(this.container);
      } else {
        const framesetElements = document.getElementsByTagName("frameset");
        if (framesetElements && framesetElements.length > 0) {
          framesetElements[0].insertAdjacentElement("afterend", this.container);
        }
      }
    }
    updateBoundingClientRect() {
      const oldRect = this.targetRelativeRect;
      this.targetRelativeRect = this.target.getBoundingClientRect();
      if (oldRect.top != this.targetRelativeRect.top || oldRect.bottom != this.targetRelativeRect.bottom || oldRect.left != this.targetRelativeRect.left || oldRect.right != this.targetRelativeRect.right) {
        this.positionPanel();
      }
    }
    positionPanel() {
      const preferredContainerHeight = this.options.height;
      let containerHeight = preferredContainerHeight;
      const containerWidth = this.options.width;
      let positionAbove = false;
      const targetTop = this.targetRelativeRect.top + window.scrollY;
      const targetBottom = this.targetRelativeRect.bottom + window.scrollY;
      const preferredArrowXCoord = this.targetRelativeRect.right - 12;
      const preferredBottom = this.targetRelativeRect.bottom + preferredContainerHeight;
      if (preferredBottom > window.innerHeight) {
        const preferredTop = this.targetRelativeRect.top - preferredContainerHeight;
        if (preferredTop >= 0) {
          positionAbove = true;
        } else {
          const overflowBottom = preferredBottom - window.innerHeight;
          const overflowTop = -preferredTop;
          if (overflowBottom > overflowTop) {
            positionAbove = true;
            containerHeight = preferredContainerHeight - overflowTop;
          } else {
            containerHeight = preferredContainerHeight - overflowBottom;
          }
        }
      }
      const targetWidth = preferredArrowXCoord - this.targetRelativeRect.left;
      let relativeLeft;
      if (targetWidth < containerWidth) {
        relativeLeft = Math.min(
          this.targetRelativeRect.left,
          window.innerWidth - containerWidth
        );
      } else {
        relativeLeft = preferredArrowXCoord - containerWidth;
      }
      const top = positionAbove ? targetTop - containerHeight : targetBottom;
      const left = relativeLeft + window.scrollX;
      this.container.style.setProperty("width", containerWidth + "px", "important");
      this.container.style.setProperty("height", containerHeight + "px", "important");
      this.container.style.setProperty("top", top + "px", "important");
      this.container.style.setProperty("left", left + "px", "important");
    }
    closePanel() {
      const panel = document.getElementById(this.options.id);
      if (panel)
        panel.parentNode.removeChild(panel);
      if (this.elementToRefocus) {
        try {
          this.elementToRefocus.focus();
        } catch {
        }
      }
    }
  }
  var Action = /* @__PURE__ */ ((Action2) => {
    Action2["CloseAllPanels"] = "closeAllPanels";
    Action2["DetectForms"] = "detectForms";
    Action2["ResetForms"] = "resetForms";
    Action2["GetPasswordProfiles"] = "getPasswordProfiles";
    Action2["GeneratePassword"] = "generatePassword";
    Action2["ManualFill"] = "manualFill";
    Action2["Primary"] = "primary";
    Action2["ShowMatchedLoginsPanel"] = "showMatchedLoginsPanel";
    Action2["PageHide"] = "pageHide";
    Action2["OpenKeePass"] = "openkeepass";
    Action2["CreateEntry"] = "createEntry";
    Action2["UpdateEntry"] = "updateEntry";
    return Action2;
  })(Action || {});
  class KeeFieldIcon {
    constructor(myPort, parentFrameId, formUtils2, createMatchedLoginsPanelNearNode) {
      this.myPort = myPort;
      this.parentFrameId = parentFrameId;
      this.formUtils = formUtils2;
      this.createMatchedLoginsPanelNearNode = createMatchedLoginsPanelNearNode;
      this.fieldsWithIcons = [];
      this.KEEFOX_ICON_16 = // eslint-disable-next-line max-len
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAOdEVYdFRpdGxlAEtlZSBsb2dvN59B9AAAABB0RVh0QXV0aG9yAEtlZSBWYXVsdGXwy5UAAAH8SURBVDiNhZDfS1NhGMc/z3vOEHea0lgXrkisvArWTUSlF9XFIKj/waugtP+hey/M5vpFN0Eg4UVB0WARSglC0IX2AwwtzdywppYsz862875dzLmDbfTcvd/n8/0+X16JX74Sxgt9AHrYmYhVfTbZ88Z6/SeWVEC/szF1brGvVDT2JRqzVLLUCTl28Xrbtq8LwL76JtU1axLhLTm/2A/A1JFp5txOM5RPSCBgM2ypLrWQSXkID+tqd8jljLMpjvgMRFcY2P+NsPI57WxId8gN+HmwkEl5NoBUuWUsrgIqZnu7xLXol6CBmF1mudIOUDU2aQAFsPoq/RkjGYB5L4KnFXvH04p5zwHAwNP8i/TybgAAYkYBitpieL0XP2D2geH1XorarqG6xgIEP0XiycH3wHGAU+0b3D44h6sthvIJZt3OOvYulx07WTcFuxojjeSlSq3u13KYT6VIAwowewOwttoeIRSC2sx2lIqpY5KPdhx43DLg+8yIK3A/qJ111gmJrtmNvvNx4ka5ZQCA0pIGKho0QET5AAYoVUXf+4ffK6y8HMsBEyVtuQC/dQgfMRjG17J3f/w3AEArc7Oo7fD4r0OMFI6ijShRarQZK81EgHhycBro23lO5rLpC824pg0AxEjjotD0OoDdarFaiT053Lb2VhB/uePn81bcX+xXu7resl9RAAAAAElFTkSuQmCC";
    }
    removeKeeIconFromAllFields() {
      for (const field of this.fieldsWithIcons) {
        const element = field.DOMelement;
        if (!element)
          continue;
        element.removeEventListener("click", this);
        element.removeEventListener("mousemove", this);
        element.style.setProperty("background-image", "");
        element.style.setProperty("background-repeat", "");
        element.style.setProperty("background-attachment", "");
        element.style.setProperty("background-size", "");
        element.style.setProperty("background-position", "");
      }
      this.fieldsWithIcons = [];
      this.passwordFields = null;
      this.otherFields = null;
    }
    addKeeIconToFields(passwordFields, otherFields, entries) {
      this.passwordFields = passwordFields;
      this.otherFields = otherFields;
      if (entries.length > 1) {
        this.getLabelledIcon(entries.length.toString());
      } else {
        this.afterImageLoaded(this.KEEFOX_ICON_16);
      }
    }
    skipField(field) {
      if (!this.formUtils.isATextFormFieldType(field.field.type) && field.field.type != "password") {
        return true;
      }
      if (!field.DOMelement || field.DOMelement instanceof HTMLSelectElement || !field.DOMelement.isConnected) {
        return true;
      }
      if (field.DOMelement.maxLength > 0 && field.DOMelement.maxLength <= 3)
        return true;
      if (field.DOMelement.offsetWidth < 50)
        return true;
      return false;
    }
    addIcon(field, image) {
      this.fieldsWithIcons.push(field);
      const element = field.DOMelement;
      element.addEventListener("click", this);
      element.addEventListener("mousemove", this);
      element.style.setProperty("background-image", "url('" + image + "')", "important");
      element.style.setProperty("background-repeat", "no-repeat", "important");
      element.style.setProperty("background-attachment", "scroll", "important");
      element.style.setProperty("background-size", "16px 16px", "important");
      element.style.setProperty("background-position", "calc(100% - 4px) 50%", "important");
      element.style.setProperty("cursor", "auto");
      const transitionConfig = window.getComputedStyle(field.DOMelement).getPropertyValue("transition-property");
      if (["all", "background"].some((val) => transitionConfig.includes(val))) {
        field.DOMelement.style.setProperty("transition", "none", "important");
      }
      this.overrideBoxShadows(element);
    }
    handleEvent(e) {
      if (e.type === "click")
        this.showMatchedLoginsPanel(e);
      if (e.type === "mousemove")
        this.hoverOverInput(e);
    }
    limitFields(fields) {
      const orderedFields = fields.filter((f) => !this.skipField(f)).sort((a, b) => {
        if (a.highestScore === b.highestScore)
          return 0;
        return a.highestScore < b.highestScore ? 1 : -1;
      });
      return orderedFields.slice(0, 2);
    }
    afterImageLoaded(image) {
      const fieldSet1 = this.limitFields(this.passwordFields);
      const fieldSet2 = this.limitFields(this.otherFields);
      for (const field of fieldSet1.concat(fieldSet2)) {
        this.addIcon(field, image);
      }
    }
    overrideBoxShadows(element) {
      const currentStyle = window.getComputedStyle(element);
      if (currentStyle) {
        const shadows = [];
        shadows.push(currentStyle.getPropertyValue("box-shadow"));
        shadows.push(currentStyle.getPropertyValue("-webkit-box-shadow"));
        shadows.push(currentStyle.getPropertyValue("-moz-box-shadow"));
        if (shadows.some((s) => s.indexOf("inset"))) {
          element.style.setProperty("box-shadow", "initial", "important");
          element.style.setProperty("-webkit-box-shadow", "initial", "important");
          element.style.setProperty("-moz-box-shadow", "initial", "important");
        }
      }
    }
    showMatchedLoginsPanel(e) {
      const bcrect = e.target.getBoundingClientRect();
      const leftLimit = bcrect.left + bcrect.width - 22;
      if (e.clientX > leftLimit && bcrect.top <= e.clientY && e.clientY <= bcrect.bottom) {
        if (this.parentFrameId !== 0) {
          this.myPort.postMessage({
            action: Action.ShowMatchedLoginsPanel
          });
        } else {
          this.createMatchedLoginsPanelNearNode(e.target);
        }
      }
    }
    hoverOverInput(e) {
      if (e.target.disabled)
        return;
      const bcrect = e.target.getBoundingClientRect();
      const leftLimit = bcrect.left + bcrect.width - 22;
      if (e.clientX > leftLimit) {
        e.target.style.setProperty("cursor", "pointer", "important");
        return;
      }
      e.target.style.setProperty("cursor", "auto");
    }
    getLabelledIcon(text) {
      const canvas = document.createElement("canvas");
      canvas.height = 16;
      canvas.width = 16;
      const img = document.createElement("img");
      img.addEventListener("load", () => {
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        context.fillStyle = "white";
        context.fillRect(6, 8, 10, 8);
        context.fillStyle = "red";
        context.font = "8px Arial";
        context.fillText(text, 7, 15);
        this.afterImageLoaded(canvas.toDataURL());
      });
      img.src = this.KEEFOX_ICON_16;
    }
  }
  class MatchResult {
  }
  var SessionType = /* @__PURE__ */ ((SessionType2) => {
    SessionType2["Event"] = "event";
    SessionType2["Websocket"] = "websocket";
    return SessionType2;
  })(SessionType || {});
  class EntrySummary {
    constructor(e) {
      this.icon = e.icon || { version: 1, iconImageData: "" };
      this.usernameValue = e.usernameValue || "<no username>";
      this.usernameName = e.usernameName || "<no username>";
      this.path = e.path || "UNKNOWN PATH";
      this.title = e.title || "";
      this.uRLs = e.uRLs || [];
      this.url = (e == null ? void 0 : e.url) || "";
      this.uuid = e.uuid || utils.newGUID();
      this.dbFileName = e.dbFileName || "";
      this.relevanceScore = e.relevanceScore;
      this.fullDetails = e.fullDetails;
      this.isPreferredMatch = e.isPreferredMatch;
    }
    static fromEntry(entry) {
      var _a, _b;
      return new EntrySummary({
        icon: entry.icon,
        usernameValue: (_a = Entry.getUsernameField(entry)) == null ? void 0 : _a.value,
        usernameName: (_b = Entry.getUsernameField(entry)) == null ? void 0 : _b.name,
        title: entry.title,
        uRLs: entry.URLs,
        url: entry == null ? void 0 : entry.URLs[0],
        uuid: entry.uuid,
        dbFileName: entry.database.fileName,
        fullDetails: entry,
        isPreferredMatch: entry.isPreferredMatch
      });
    }
    static fromKPRPCEntrySummaryDTO(entrySummaryDto, path, dbFileName) {
      return new EntrySummary({
        icon: { version: 1, iconImageData: entrySummaryDto.iconImageData },
        usernameValue: entrySummaryDto.usernameValue,
        usernameName: entrySummaryDto.usernameName,
        path,
        title: entrySummaryDto.title,
        uRLs: entrySummaryDto.uRLs,
        url: entrySummaryDto == null ? void 0 : entrySummaryDto.uRLs[0],
        uuid: entrySummaryDto.uniqueID,
        dbFileName
      });
    }
  }
  class Group {
    //childEntries: Entry[] - this is only needed if we ever request GetAllDatabases(true) but Kee currently has no need for this KPRPC feature
    constructor(g) {
      this.title = g.title || "";
      this.uuid = g.uuid || utils.newGUID();
      this.icon = g.icon || { version: 1, iconImageData: "" };
      this.path = g.path || "UNKNOWN PATH";
      this.entrySummaries = g.entrySummaries || [];
      this.groups = g.groups || [];
    }
    static fromKPRPCGroupDTO(groupDto, dbFileName) {
      return new Group({
        title: groupDto.title,
        uuid: groupDto.uniqueID,
        icon: { version: 1, iconImageData: groupDto.iconImageData },
        path: groupDto.path,
        entrySummaries: groupDto.childLightEntries.map(
          (childLightEntry) => EntrySummary.fromKPRPCEntrySummaryDTO(childLightEntry, groupDto.path, dbFileName)
        ),
        groups: groupDto.childGroups.map(
          (childGroup) => this.fromKPRPCGroupDTO(childGroup, dbFileName)
        )
      });
    }
    static containsId(group, id) {
      if (group.uuid === id)
        return true;
      if (group.groups && group.groups.some((g) => Group.containsId(g, id)))
        return true;
      return false;
    }
    static matchingId(group, id) {
      if (group.uuid === id) {
        return group;
      }
      for (const childGroup of group.groups) {
        const matchingChildGroup = Group.matchingId(childGroup, id);
        if (matchingChildGroup) {
          return matchingChildGroup;
        }
      }
      return null;
    }
  }
  class Database {
    constructor(db) {
      this.name = db.name || "";
      this.fileName = db.fileName || "";
      this.icon = db.icon || { version: 1, iconImageData: "" };
      this.root = db.root || new Group({});
      this.active = db.active || false;
      this.sessionType = db.sessionType || SessionType.Event;
      this.sessionFeatures = db.sessionFeatures || [""];
    }
    static fromKPRPCDatabaseDTO(dto, sessionType, sessionFeatures) {
      return new Database({
        name: dto.name,
        fileName: dto.fileName,
        icon: { version: 1, iconImageData: dto.iconImageData },
        root: Group.fromKPRPCGroupDTO(dto.root, dto.fileName),
        active: dto.active,
        sessionType,
        sessionFeatures
      });
    }
  }
  class Locator {
    constructor(locator) {
      this.id = locator.id || "";
      this.name = locator.name || "";
      this.type = locator.type || "";
      this.query = locator.query;
      this.labels = locator.labels;
      this.autocompleteValues = locator.autocompleteValues;
    }
    //TODO:4: Things like MaxLength that can be used to both help identify the field and generate new values/passwords
  }
  class EntryDto {
  }
  var FormFieldTypeDTO = /* @__PURE__ */ ((FormFieldTypeDTO2) => {
    FormFieldTypeDTO2["radio"] = "FFTradio";
    FormFieldTypeDTO2["username"] = "FFTusername";
    FormFieldTypeDTO2["text"] = "FFTtext";
    FormFieldTypeDTO2["password"] = "FFTpassword";
    FormFieldTypeDTO2["select"] = "FFTselect";
    FormFieldTypeDTO2["checkbox"] = "FFTcheckbox";
    return FormFieldTypeDTO2;
  })(FormFieldTypeDTO || {});
  function $STR(str) {
    const msg = browserPolyfillExports.i18n.getMessage(str);
    return msg || str;
  }
  class Field {
    constructor(field) {
      this.name = field.name || "";
      this.value = field.value || "";
      this.resetValue = field.resetValue || "";
      this.uuid = field.uuid || utils.newGUID();
      this.type = field.type || "text";
      this.locators = field.locators || [];
    }
    static getDisplayValueInternal(field, revealPasswords, replacementIfProtected) {
      if (field.type === "boolean") {
        return field.value === "KEEFOX_CHECKED_FLAG_TRUE" ? $STR("enabled") : $STR("disabled");
      } else {
        return field.type === "password" && !revealPasswords ? replacementIfProtected : field.value;
      }
    }
    static getDisplayValue(field, revealPasswords) {
      return Field.getDisplayValueInternal(
        field,
        revealPasswords,
        "*".repeat(field.value.length)
      );
    }
    static getDisplayName(field) {
      if (field.name === "KeePass username") {
        return $STR("username");
      } else if (field.name === "KeePass password") {
        return $STR("password");
      } else {
        return field.name ? field.name : "[ " + $STR("no_name") + " ]";
      }
    }
    static getDisplayTooltip(field, revealPasswords) {
      return Field.getDisplayName(field) + ": " + Field.getDisplayValueInternal(field, revealPasswords, $STR("click_to_reveal_hide"));
    }
    static typeFromDOMtype(domType) {
      switch (domType) {
        case "password":
          return "password";
        case "radio":
          return "existing";
        case "checkbox":
          return "boolean";
        case "select-one":
          return "existing";
        default:
          return "text";
      }
    }
    // By convention the first non-password item will be the username and the password will be either 1st or 2nd in the list
    static combineDomFieldLists(usernameIndex, otherFields, passwords) {
      const fields = [];
      if (usernameIndex >= 0 && otherFields[usernameIndex]) {
        fields.push(otherFields[usernameIndex]);
      }
      passwords.forEach((f) => {
        fields.push(f);
      });
      otherFields.forEach((f, index) => {
        if (index !== usernameIndex) {
          fields.push(f);
        }
      });
      return fields;
    }
    static fromDOM(element, domType, value) {
      const labels = collectLabels(element);
      return new Field({
        uuid: utils.newGUID(),
        name: labels && labels.length ? labels[0] : element.name,
        locators: [
          new Locator({
            name: element.name,
            id: element.id,
            type: domType,
            labels,
            autocompleteValues: collectAutocompleteValues(element)
          })
        ],
        value,
        type: Field.typeFromDOMtype(domType)
      });
    }
    static fromKPRPCFieldDTO(f) {
      let type = "text";
      let locatorType = "text";
      switch (f.type) {
        case FormFieldTypeDTO.password:
          type = "password";
          locatorType = "password";
          break;
        case FormFieldTypeDTO.radio:
          type = "existing";
          locatorType = "radio";
          break;
        case FormFieldTypeDTO.checkbox:
          type = "boolean";
          locatorType = "checkbox";
          break;
        case FormFieldTypeDTO.select:
          type = "existing";
          locatorType = "select";
          break;
        case FormFieldTypeDTO.username:
          type = "text";
          locatorType = "text";
          break;
        case FormFieldTypeDTO.text:
          type = "text";
          locatorType = "text";
          break;
      }
      return new Field({
        name: f.displayName || f.name,
        uuid: utils.newGUID(),
        value: f.value,
        resetValue: f.value,
        type,
        locators: [
          new Locator({
            id: f.id,
            name: f.name,
            type: locatorType
          })
        ]
      });
    }
    static toKPRPCFieldDTO(f, isUsername) {
      let fft;
      switch (f.locators[0].type) {
        case "password":
          fft = FormFieldTypeDTO.password;
          break;
        case "radio":
          fft = FormFieldTypeDTO.radio;
          break;
        case "checkbox":
          fft = FormFieldTypeDTO.checkbox;
          break;
        case "select-one":
          fft = FormFieldTypeDTO.select;
          break;
        default:
          fft = isUsername ? FormFieldTypeDTO.username : FormFieldTypeDTO.text;
          break;
      }
      return {
        displayName: f.name,
        id: f.locators[0].id,
        name: f.locators[0].name,
        type: fft,
        value: f.value,
        page: -1
      };
    }
  }
  function collectLabels(element) {
    var _a, _b, _c, _d;
    const labels = [];
    const labelsCount = ((_a = element.labels) == null ? void 0 : _a.length) || 0;
    for (let i = 0; i < labelsCount; i++) {
      const label = element.labels[i];
      if (label == null ? void 0 : label.innerText)
        labels.push(label.innerText);
    }
    const ariaLabel = (_b = element.getAttribute("aria-label")) == null ? void 0 : _b.toLowerCase();
    if (ariaLabel)
      labels.push(ariaLabel);
    const ariaLabelIds = [];
    (_c = element.getAttribute("aria-labelledby")) == null ? void 0 : _c.trim().split(" ").forEach((id) => {
      if (id)
        ariaLabelIds.push(id);
    });
    (_d = element.getAttribute("aria-describedby")) == null ? void 0 : _d.trim().split(" ").forEach((id) => {
      if (id)
        ariaLabelIds.push(id);
    });
    ariaLabelIds.forEach((id) => {
      const labelElement = document.getElementById(id);
      if (labelElement == null ? void 0 : labelElement.innerText)
        labels.push(labelElement.innerText);
    });
    return labels.length ? labels : void 0;
  }
  function collectAutocompleteValues(element) {
    var _a, _b;
    const values = [];
    (_b = (_a = element.attributes["autocomplete"]) == null ? void 0 : _a.value) == null ? void 0 : _b.trim().split(" ").forEach((v) => {
      if (v)
        values.push(v.toLowerCase());
    });
    return values.length ? values : void 0;
  }
  class GroupSummary {
    constructor(g) {
      this.title = g.title || "";
      this.uuid = g.uuid || utils.newGUID();
      this.icon = g.icon || { version: 1, iconImageData: "" };
      this.path = g.path || "UNKNOWN PATH";
    }
    static fromKPRPCGroupSummaryDTO(groupSummaryDto) {
      return new GroupSummary({
        title: groupSummaryDto.title,
        uuid: groupSummaryDto.uniqueID,
        icon: { version: 1, iconImageData: groupSummaryDto.iconImageData },
        path: groupSummaryDto.path
      });
    }
    static fromGroup(group) {
      return new GroupSummary({
        title: group.title,
        uuid: group.uuid,
        icon: group.icon,
        path: group.path
      });
    }
  }
  class Entry {
    constructor(e) {
      this.alwaysAutoFill = e.alwaysAutoFill || false;
      this.alwaysAutoSubmit = e.alwaysAutoSubmit || false;
      this.neverAutoFill = e.neverAutoFill || false;
      this.neverAutoSubmit = e.neverAutoSubmit || false;
      this.URLs = e.URLs || [];
      this.fields = e.fields || [];
      this.httpRealm = e.httpRealm || "";
      this.parentGroup = e.parentGroup || null;
      this.uuid = e.uuid || utils.newGUID();
      this.title = e.title || "";
      this.matchAccuracy = e.matchAccuracy || 0;
      this.icon = e.icon || { version: 1, iconImageData: "" };
      this.database = e.database || new Database({});
      this.relevanceScore = e.relevanceScore;
      this.lowFieldMatchRatio = e.lowFieldMatchRatio;
      this.formIndex = e.formIndex;
      this.entryIndex = e.entryIndex;
      this.isPreferredMatch = e.isPreferredMatch;
    }
    static getUsernameField(entry) {
      return entry.fields.find((f) => f.type === "text");
    }
    static getPasswordField(entry) {
      return entry.fields.find((f) => f.type === "password");
    }
    static fromKPRPCEntryDTO(entryDto, db) {
      const sortedFields = [];
      let maximumPage = 1;
      const usernameIndex = entryDto.formFieldList.findIndex(
        (f) => f.type === FormFieldTypeDTO.username
      );
      const unsortedFields = entryDto.formFieldList.map((f) => {
        if (f.page > maximumPage)
          maximumPage = f.page;
        return Field.fromKPRPCFieldDTO(f);
      });
      const firstPasswordIndex = unsortedFields.findIndex((f) => f.type === "password");
      if (usernameIndex > -1) {
        sortedFields.push(unsortedFields[usernameIndex]);
      }
      if (firstPasswordIndex > -1) {
        sortedFields.push(unsortedFields[firstPasswordIndex]);
      }
      unsortedFields.forEach((f, i) => {
        if (i !== usernameIndex && i !== firstPasswordIndex) {
          sortedFields.push(f);
        }
      });
      const entry = new Entry({
        URLs: entryDto.uRLs,
        neverAutoFill: entryDto.neverAutoFill,
        alwaysAutoFill: entryDto.alwaysAutoFill,
        neverAutoSubmit: entryDto.neverAutoSubmit,
        alwaysAutoSubmit: entryDto.alwaysAutoSubmit,
        icon: { version: 1, iconImageData: entryDto.iconImageData },
        parentGroup: GroupSummary.fromKPRPCGroupSummaryDTO(entryDto.parent),
        database: db,
        matchAccuracy: entryDto.matchAccuracy,
        httpRealm: entryDto.hTTPRealm,
        uuid: entryDto.uniqueID,
        title: entryDto.title,
        fields: sortedFields
      });
      return entry;
    }
    static toKPRPCEntryDTO(entry) {
      const entryDto = new EntryDto();
      entryDto.alwaysAutoFill = entry.alwaysAutoFill;
      entryDto.alwaysAutoSubmit = entry.alwaysAutoSubmit;
      entryDto.formFieldList = entry.fields.map((f, i) => Field.toKPRPCFieldDTO(f, i === 0));
      entryDto.hTTPRealm = entry.httpRealm;
      entryDto.iconImageData = entry.icon.iconImageData;
      entryDto.neverAutoFill = entry.neverAutoFill;
      entryDto.neverAutoSubmit = entry.neverAutoSubmit;
      entryDto.title = entry.title;
      entryDto.uRLs = entry.URLs;
      return entryDto;
    }
  }
  class FormFilling {
    constructor(store2, myPort, parentFrameId, formUtils2, formSaving2, Logger, config, matchFinder) {
      this.store = store2;
      this.myPort = myPort;
      this.parentFrameId = parentFrameId;
      this.formUtils = formUtils2;
      this.formSaving = formSaving2;
      this.Logger = Logger;
      this.config = config;
      this.matchFinder = matchFinder;
      this.findLoginOp = {};
      this.matchResult = new MatchResult();
      this.formFinderTimer = null;
      this.keeFieldIcon = new KeeFieldIcon(
        myPort,
        parentFrameId,
        formUtils2,
        this.createMatchedLoginsPanelNearNode.bind(this)
      );
    }
    executePrimaryAction() {
      if (this.matchResult.entries && this.matchResult.entries.length > 0 && this.matchResult.mostRelevantFormIndex != null && this.matchResult.mostRelevantFormIndex >= 0) {
        if (this.matchResult.entries[this.matchResult.mostRelevantFormIndex].length == 1) {
          this.fillAndSubmit(false, this.matchResult.mostRelevantFormIndex, 0);
          this.closeMatchedLoginsPanel();
        } else if (this.matchResult.entries[this.matchResult.mostRelevantFormIndex].length > 1) {
          this.closeMatchedLoginsPanel();
          this.matchedLoginsPanelStub = new PanelStub(
            PanelStubOptions.MatchedLogins,
            null,
            this.parentFrameId
          );
          this.matchedLoginsPanelStub.createPanel();
        }
      }
    }
    createMatchedLoginsPanelInCenter(specificFrameId) {
      this.closeMatchedLoginsPanel();
      this.matchedLoginsPanelStub = new PanelStub(
        PanelStubOptions.MatchedLogins,
        null,
        specificFrameId
      );
      this.matchedLoginsPanelStub.createPanel();
    }
    createMatchedLoginsPanelNearNode(target) {
      this.closeMatchedLoginsPanel();
      this.matchedLoginsPanelStub = new PanelStub(
        PanelStubOptions.MatchedLogins,
        target,
        this.parentFrameId
      );
      KeeLog.debug("Creating panel...");
      this.matchedLoginsPanelStub.createPanel();
      this.matchedLoginsPanelStubRaf = requestAnimationFrame(
        () => this.updateMatchedLoginsPanelPosition()
      );
    }
    closeMatchedLoginsPanel() {
      if (this.matchedLoginsPanelStub)
        this.matchedLoginsPanelStub.closePanel();
      this.matchedLoginsPanelStub = null;
      cancelAnimationFrame(this.matchedLoginsPanelStubRaf);
    }
    updateMatchedLoginsPanelPosition() {
      this.matchedLoginsPanelStub.updateBoundingClientRect();
      this.matchedLoginsPanelStubRaf = requestAnimationFrame(
        () => this.updateMatchedLoginsPanelPosition()
      );
    }
    // Requires KeePassRPC #101
    // private calculateLabelMatchScore(matchedField: MatchedField, dataField: Field) {
    //     if (!matchedField.field.name || !dataField.name) return 0;
    //     // We only persist a single "label" value, implicitly via the display name
    //     // field. Could change this in future with additional features added to the
    //     // KeePassRPC libraries.
    //     if (
    //         matchedField.field.locators[0].labels.some(
    //             matchedFieldLabel =>
    //                 matchedFieldLabel.toLowerCase() === dataField.name.toLowerCase()
    //         )
    //     ) {
    //         return 100;
    //     }
    //     const weakMatchLabels = [dataField.name.toLowerCase()];
    //     if (dataField.name !== dataField.locators[0].name) {
    //         weakMatchLabels.push(dataField.locators[0].name.toLowerCase());
    //     }
    //     if (
    //         matchedField.field.locators[0].labels.some(matchedFieldLabel => {
    //             weakMatchLabels.some(
    //                 dataLabel => matchedFieldLabel.toLowerCase().indexOf(dataLabel) >= 0
    //             );
    //         })
    //     ) {
    //         return 30;
    //     }
    //     return 0;
    // }
    calculateFieldMatchScore(matchedField, dataField, _currentPage, config, isVisible) {
      const formField = matchedField.field;
      let score = 1;
      if (formField.type !== dataField.type)
        return 0;
      if (formField.locators[0].id != null && formField.locators[0].id != void 0 && formField.locators[0].id != "" && formField.locators[0].id == dataField.locators[0].id) {
        score += 50;
      } else if (config.punishWrongIDAndName && dataField.locators[0].id) {
        score -= 5;
      }
      if (formField.locators[0].name != null && formField.locators[0].name != void 0 && formField.locators[0].name != "" && formField.locators[0].name == dataField.locators[0].name) {
        score += 40;
      } else if (config.punishWrongIDAndName && dataField.locators[0].name) {
        score -= 5;
      }
      if (formField.locators[0].type === "radio" && formField.value != null && formField.value != void 0 && formField.value != "" && formField.value == dataField.value) {
        score += 30;
      }
      if (isVisible === void 0 && this.formUtils.isDOMElementVisible(matchedField.DOMelement)) {
        isVisible = true;
      }
      score += isVisible ? 35 : 0;
      return score;
    }
    fillMatchedFields(fieldScoreMatrix, dataFields, formFields, automated) {
      fieldScoreMatrix.sort(function(a, b) {
        return b.score - a.score;
      });
      const filledFields = [];
      while (fieldScoreMatrix.length > 0 && fieldScoreMatrix[0].score > 0) {
        const ffi = fieldScoreMatrix[0].formFieldIndex;
        const dfi = fieldScoreMatrix[0].dataFieldIndex;
        const formField = formFields[ffi];
        const dataField = dataFields[dfi];
        const domElement = formField.DOMelement;
        const currentValue = this.getFormFieldCurrentValue(
          domElement,
          formField.field.locators[0].type
        );
        if (automated && currentValue && currentValue !== domElement.keeInitialDetectedValue) {
          this.Logger.info(
            "Not filling field because it's not empty and was edited by user since last load/fill"
          );
        } else if (automated && currentValue && !configManager.current.autoFillFieldsWithExistingValue) {
          this.Logger.info(
            "Not filling field because it's not empty and user preference is to prevent automatic fill"
          );
        } else {
          this.Logger.info(
            "We will populate field " + ffi + " (id:" + formField.field.locators[0].id + ")"
          );
          this.fillASingleField(
            domElement,
            formField.field.locators[0].type,
            dataField.value
          );
        }
        filledFields.push({
          id: formField.field.locators[0].id,
          DOMelement: domElement,
          name: formField.field.locators[0].name,
          value: dataField.value
        });
        fieldScoreMatrix = fieldScoreMatrix.filter(function(element) {
          return element.dataFieldIndex != dfi && element.formFieldIndex != ffi;
        });
        fieldScoreMatrix.sort(function(a, b) {
          return b.score - a.score;
        });
      }
      return filledFields;
    }
    getFormFieldCurrentValue(domElement, fieldType) {
      let currentValue = domElement.value;
      if (domElement instanceof HTMLInputElement && fieldType === "checkbox") {
        if (domElement.checked) {
          currentValue = "KEEFOX_CHECKED_FLAG_TRUE";
        } else {
          currentValue = "KEEFOX_CHECKED_FLAG_FALSE";
        }
      }
      return currentValue;
    }
    fillASingleField(domElement, fieldType, value) {
      if (fieldType == "select-one") {
        domElement.value = value;
      } else if (domElement instanceof HTMLInputElement && fieldType == "checkbox") {
        if (value == "KEEFOX_CHECKED_FLAG_TRUE")
          domElement.checked = true;
        else
          domElement.checked = false;
      } else if (domElement instanceof HTMLInputElement && fieldType == "radio") {
        domElement.checked = true;
      } else {
        domElement.value = value;
      }
      domElement.keeInitialDetectedValue = value;
      domElement.dispatchEvent(
        new UIEvent("input", {
          view: window,
          bubbles: true,
          cancelable: true
        })
      );
      domElement.dispatchEvent(
        new UIEvent("change", {
          view: window,
          bubbles: true,
          cancelable: true
        })
      );
    }
    fillManyFormFields(formFields, dataFields, currentPage, scoreConfig, automated) {
      this.Logger.debug("_fillManyFormFields started");
      if (formFields == null || formFields == void 0 || dataFields == null || dataFields == void 0) {
        return;
      }
      this.Logger.debug("We've received the data we need");
      this.Logger.info("Filling form fields for page " + currentPage);
      const fieldScoreMatrix = [];
      for (let i = 0; i < formFields.length; i++) {
        for (let j = 0; j < dataFields.length; j++) {
          const score = this.calculateFieldMatchScore(
            formFields[i],
            dataFields[j],
            currentPage,
            scoreConfig
          );
          this.Logger.debug(
            "Suitability of putting data field " + j + " into form field " + i + " (id: " + formFields[i].field.locators[0].id + ") is " + score
          );
          fieldScoreMatrix.push({
            score,
            dataFieldIndex: j,
            formFieldIndex: i
          });
        }
      }
      return this.fillMatchedFields(fieldScoreMatrix, dataFields, formFields, automated);
    }
    initMatchResult(behaviour) {
      this.matchResult.UUID = "";
      this.matchResult.entries = [];
      this.matchResult.mostRelevantFormIndex = null;
      this.matchResult.mustAutoFillForm = false;
      this.matchResult.cannotAutoFillForm = false;
      this.matchResult.mustAutoSubmitForm = false;
      this.matchResult.cannotAutoSubmitForm = false;
      if (behaviour.UUID != void 0 && behaviour.UUID != null && behaviour.UUID != "") {
        this.matchResult.UUID = behaviour.UUID;
        this.matchResult.dbFileName = behaviour.dbFileName;
        this.matchResult.mustAutoFillForm = true;
        if (behaviour.mustAutoSubmitForm)
          this.matchResult.mustAutoSubmitForm = true;
      }
      this.matchResult.doc = window.document;
      this.matchResult.formReadyForSubmit = false;
      this.matchResult.autofillOnSuccess = behaviour.autofillOnSuccess;
      this.matchResult.autosubmitOnSuccess = behaviour.autosubmitOnSuccess;
      this.matchResult.notifyUserOnSuccess = behaviour.notifyUserOnSuccess;
      this.matchResult.wrappers = [];
      this.matchResult.allMatchingLogins = [];
      this.matchResult.formRelevanceScores = [];
      this.matchResult.submitTargets = [];
      this.matchResult.usernameIndexArray = [];
      this.matchResult.passwordFieldsArray = [];
      this.matchResult.otherFieldsArray = [];
      this.matchResult.requestCount = 0;
      this.matchResult.responseCount = 0;
      this.matchResult.requestIds = [];
    }
    /* Expects this data object:
    {
        autofillOnSuccess: true, // This won't override other configuration options if true but if false it will.
        autosubmitOnSuccess: true, // This won't override other configuration options if true but if false it will.
        notifyUserOnSuccess: true, // e.g. used when periodic form polling finds a form after the page has loaded.
        ... others
    }
    */
    findMatchesInThisFrame(behaviour = {}) {
      this.semanticWhitelistCache = {};
      this.semanticBlacklistCache = {};
      if (this.formFinderTimer !== null) {
        clearTimeout(this.formFinderTimer);
        this.formFinderTimer = null;
      }
      if (window.document.forms.length > 50) {
        this.Logger.debug(
          "Too many forms on this page. Assuming it is not a login page and avoiding looking for login forms in order to avoid performance impact."
        );
      }
      let forms = new Array();
      for (let i = 0; i < window.document.forms.length; i++) {
        forms.push(window.document.forms.item(i));
      }
      const pseudoForm = this.scanForOrphanedFields(window.document);
      if (pseudoForm) {
        forms = Array.prototype.slice.call(forms);
        forms.push(pseudoForm);
      }
      if (!forms || forms.length == 0) {
        this.Logger.info("No forms found on this page.");
        return;
      }
      const url = new URL(window.document.URL);
      url.hostname = punycode.toUnicode(url.hostname);
      this.Logger.info(
        "Finding matches in a document. readyState: " + window.document.readyState
      );
      this.initMatchResult(behaviour);
      this.matchResult.forms = forms;
      const conf = configManager.siteConfigFor(url.href);
      this.Logger.debug("findMatches processing " + forms.length + " forms");
      let searchSentToKeePass = false;
      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        this.matchResult.entries[i] = [];
        this.matchResult.formRelevanceScores[i] = 0;
        this.Logger.debug("about to get form fields");
        let scanResult;
        try {
          scanResult = this.formUtils.getFormFields(form, false, 50);
        } catch (e) {
          this.Logger.debug("Lost interest in this form after finding too many fields" + e);
          continue;
        }
        const usernameIndex = scanResult.actualUsernameIndex;
        const passwordFields = scanResult.pwFields;
        const otherFields = scanResult.otherFields;
        let interestingForm = null;
        interestingForm = configManager.isFormInteresting(
          form,
          conf,
          otherFields.map((f) => f.field)
        );
        if (interestingForm === false) {
          this.Logger.debug(
            "Lost interest in this form after inspecting field names and IDs"
          );
          continue;
        }
        const noPasswordField = passwordFields == null || passwordFields.length <= 0 || passwordFields[0] == null;
        const noOtherField = usernameIndex < 0 || otherFields == null || otherFields.length <= 0 || otherFields[usernameIndex] == null;
        if (noPasswordField && (noOtherField || interestingForm !== true)) {
          this.Logger.debug(
            "No password field found in this form and either there are no other fields or no whitelisted text field or form element"
          );
          continue;
        }
        let submitTargetNeighbour;
        if (noPasswordField) {
          submitTargetNeighbour = otherFields[usernameIndex].DOMelement;
        } else {
          submitTargetNeighbour = passwordFields[0].DOMelement;
        }
        this.attachSubmitHandlers(form, submitTargetNeighbour, i);
        this.matchResult.usernameIndexArray[i] = usernameIndex;
        this.matchResult.passwordFieldsArray[i] = passwordFields;
        this.matchResult.otherFieldsArray[i] = otherFields;
        this.matchResult.submitTargets[i] = submitTargetNeighbour;
        if (!searchSentToKeePass) {
          this.findLoginOp.forms = forms;
          this.findLoginOp.formIndexes = [i];
          this.findLoginOp.wrappedBy = this.matchResult;
          this.matchResult.wrappers[i] = this.findLoginOp;
          this.matchResult.requestCount++;
          this.matchFinder(url.href);
          searchSentToKeePass = true;
        } else {
          this.Logger.debug("form[" + i + "]: reusing entries from last form.");
          this.findLoginOp.formIndexes.push(i);
        }
      }
    }
    // It's OK for this to take a few seconds - humans can't type that fast.
    // By making this async we allow the search for entries to begin earlier
    // and reduce perceived impact on page load time
    async attachSubmitHandlers(form, submitTargetNeighbour, formNumber) {
      try {
        await Promise.resolve();
        const start = performance.now();
        const submitTarget = this.findSubmitButton(form, submitTargetNeighbour);
        this.formSaving.addSubmitHandler(submitTarget, form);
        KeeLog.info(
          "Submit handlers attached asynchronously to form " + formNumber + " in " + (performance.now() - start) + "ms"
        );
      } catch (e) {
        KeeLog.warn("Exception while adding submit handler. Message: " + e.message);
      }
    }
    scanForOrphanedFields(doc) {
      const t = (/* @__PURE__ */ new Date()).getTime();
      const orphanedFields = [];
      let pseudoForm = null;
      const items = doc.getElementsByTagName("input");
      for (const tag of items) {
        if (!tag.form)
          orphanedFields.push(tag);
      }
      if (orphanedFields.length > 0) {
        pseudoForm = {
          elements: orphanedFields,
          id: "Kee-pseudo-form",
          name: "Kee-pseudo-form",
          ownerDocument: doc,
          getElementsByTagName: function() {
            return this.elements;
          },
          // Only use is for listing input elements
          querySelectorAll: function() {
            return [];
          },
          // Only use is for listing button elements
          submit: function() {
            return;
          },
          // Not possible to submit a pseudo form unless a button with custom JS has already been found
          offsetParent: true,
          // This tricks element visibility checks into treating this as visible to the user
          addEventListener: function() {
            return;
          },
          //TODO:4: hook up to the submit function to simulate real form submission
          removeEventListener: function() {
            return;
          }
        };
      }
      const tn = (/* @__PURE__ */ new Date()).getTime();
      this.Logger.debug("scanForOrphanedFields took: " + (tn - t));
      return pseudoForm;
    }
    findLoginsResultHandler(entries) {
      if (!entries)
        return;
      const validEntries = entries.filter(
        (e) => Entry.getUsernameField(e) || Entry.getPasswordField(e)
      );
      this.matchResult = this.getRelevanceOfLoginMatchesAgainstAllForms(
        validEntries,
        this.findLoginOp,
        this.matchResult
      );
      this.fillAndSubmit(true);
    }
    getRelevanceOfLoginMatchesAgainstAllForms(entries, findLoginOp, matchResult) {
      const crString = JSON.stringify(entries);
      let firstMatchProcessed = false;
      for (let i = 0; i < findLoginOp.forms.length; i++) {
        if (findLoginOp.formIndexes.indexOf(i) == -1)
          continue;
        matchResult.entries[i] = JSON.parse(crString);
        if (matchResult.entries[i].length == 0)
          continue;
        this.Logger.info("match found!");
        const formVisible = this.formUtils.isDOMElementVisible(matchResult.submitTargets[i]);
        this.Logger.debug("formVisible: " + formVisible);
        const visibleFieldCache = {
          other: matchResult.otherFieldsArray[i].map(
            (f) => this.formUtils.isDOMElementVisible(f.DOMelement)
          ),
          password: matchResult.passwordFieldsArray[i].map(
            (f) => this.formUtils.isDOMElementVisible(f.DOMelement)
          )
        };
        for (let v = 0; v < matchResult.entries[i].length; v++) {
          const features = this.store.state.KeePassDatabases.find(
            (db) => db.fileName === matchResult.entries[i][v].database.fileName
          ).sessionFeatures;
          const fieldMatchScoreConfig = {
            punishWrongIDAndName: features.indexOf("KPRPC_FIELD_DEFAULT_NAME_AND_ID_EMPTY") >= 0
          };
          const { score, lowFieldMatchRatio } = this.calculateRelevanceScore(
            matchResult.entries[i][v],
            matchResult.passwordFieldsArray[i],
            matchResult.otherFieldsArray[i],
            matchResult.currentPage,
            formVisible,
            fieldMatchScoreConfig,
            visibleFieldCache
          );
          matchResult.entries[i][v].relevanceScore = score;
          matchResult.entries[i][v].lowFieldMatchRatio = lowFieldMatchRatio;
          matchResult.entries[i][v].formIndex = i;
          matchResult.entries[i][v].entryIndex = v;
          if (!firstMatchProcessed || matchResult.entries[i][v].relevanceScore > matchResult.allMatchingLogins[v].relevanceScore) {
            this.Logger.debug(
              "Higher relevance score found for entry " + v + " with formIndex " + matchResult.entries[i][v].formIndex + " (" + findLoginOp.forms[i].id + ")"
            );
            matchResult.allMatchingLogins[v] = matchResult.entries[i][v];
          }
        }
        firstMatchProcessed = true;
        matchResult.entries[i].forEach(function(c) {
          if (c.relevanceScore > matchResult.formRelevanceScores[i]) {
            matchResult.formRelevanceScores[i] = c.relevanceScore;
          }
        });
        this.Logger.debug(
          "Relevance of form " + i + " (" + findLoginOp.forms[i].id + ") is " + matchResult.formRelevanceScores[i]
        );
      }
      return matchResult;
    }
    getMostRelevantForm(formIndex) {
      const findMatchesResult = this.matchResult;
      if (!findMatchesResult) {
        return {
          bestFormIndex: 0,
          bestRelevanceScore: 0,
          bestFindMatchesResult: void 0
        };
      }
      let mostRelevantFormIndex = 0;
      if (formIndex >= 0)
        mostRelevantFormIndex = formIndex;
      else {
        findMatchesResult.formRelevanceScores.forEach((c, index) => {
          this.Logger.debug("Relevance of form is " + c);
          if (c > findMatchesResult.formRelevanceScores[mostRelevantFormIndex]) {
            mostRelevantFormIndex = index;
          }
        });
      }
      this.Logger.debug("The most relevant form is #" + mostRelevantFormIndex);
      return {
        bestFormIndex: mostRelevantFormIndex,
        bestRelevanceScore: findMatchesResult.formRelevanceScores[mostRelevantFormIndex],
        bestFindMatchesResult: findMatchesResult
      };
    }
    // automated could be on page load or resulting from other non-user-interaction.
    // It's possible to fill and submit a entry with a specific uuid but
    // that process is now centered on the findMatches function. This function just
    // takes the results of that (which may include a specific entry to fill and submit to a specific form)
    fillAndSubmit(automated, formIndex, entryIndex) {
      this.Logger.debug(
        "fillAndSubmit started. automated: " + automated + ", formIndex: " + formIndex + ", entryIndex: " + entryIndex
      );
      const matchResult = this.matchResult;
      let submitTargetNeighbour;
      if (!matchResult)
        return;
      const isMatchedLoginRequest = !automated && (matchResult.mostRelevantFormIndex !== null && matchResult.mostRelevantFormIndex >= 0 || typeof formIndex != "undefined") && typeof entryIndex != "undefined";
      if (!isMatchedLoginRequest) {
        matchResult.mostRelevantFormIndex = this.getMostRelevantForm().bestFormIndex;
      }
      if (formIndex !== null && formIndex >= 0)
        matchResult.mostRelevantFormIndex = formIndex;
      const form = matchResult.forms[matchResult.mostRelevantFormIndex];
      const passwordFields = matchResult.passwordFieldsArray[matchResult.mostRelevantFormIndex];
      const otherFields = matchResult.otherFieldsArray[matchResult.mostRelevantFormIndex];
      const orderedEntries = this.sortMatchedEntries(
        matchResult.entries[matchResult.mostRelevantFormIndex]
      );
      const orderedEntriesWithPreference = this.flagUserPreferredEntry(orderedEntries);
      if (!isMatchedLoginRequest && matchResult.entries[matchResult.mostRelevantFormIndex].length > 0) {
        this.myPort.postMessage({
          entries: orderedEntriesWithPreference
        });
        this.keeFieldIcon.addKeeIconToFields(
          passwordFields,
          otherFields,
          orderedEntriesWithPreference
        );
      }
      let matchingLogin = null;
      let action = { fill: false, submit: false };
      let multipleMatches = false;
      matchResult.cannotAutoFillForm = false;
      matchResult.cannotAutoSubmitForm = false;
      if (automated && matchResult.autofillOnSuccess === false) {
        matchResult.cannotAutoFillForm = true;
      }
      if (automated && matchResult.autosubmitOnSuccess === false) {
        matchResult.cannotAutoSubmitForm = true;
      }
      if (!matchResult.cannotAutoFillForm) {
        this.Logger.debug("We are allowed to auto-fill this form.");
        if (entryIndex >= 0) {
          matchingLogin = matchResult.entries[matchResult.mostRelevantFormIndex][entryIndex];
          matchResult.UUID = null;
          matchResult.dbFileName = null;
        }
        let checkMatchingLoginRelevanceThreshold = false;
        if (matchingLogin == null && matchResult.entries[matchResult.mostRelevantFormIndex].length == 1) {
          matchingLogin = matchResult.entries[matchResult.mostRelevantFormIndex][0];
          checkMatchingLoginRelevanceThreshold = true;
        } else if (matchResult.UUID != void 0 && matchResult.UUID != null && matchResult.UUID != "") {
          this.Logger.debug(
            "We've been told to use an entry with this UUID: " + matchResult.UUID
          );
          for (let count = 0; count < matchResult.entries[matchResult.mostRelevantFormIndex].length; count++) {
            if (matchResult.entries[matchResult.mostRelevantFormIndex][count].uuid == matchResult.UUID) {
              matchingLogin = matchResult.entries[matchResult.mostRelevantFormIndex][count];
              break;
            }
          }
          if (matchingLogin == null) {
            this.Logger.warn(
              "Could not find the required KeePass entry. Maybe the website redirected you to a different domain or hostname?"
            );
          }
        } else if (matchingLogin == null && (!matchResult.entries[matchResult.mostRelevantFormIndex] || !matchResult.entries[matchResult.mostRelevantFormIndex].length)) {
          this.Logger.debug("No entries for form.");
        } else if (matchingLogin == null) {
          this.Logger.debug(
            "Multiple entries for form, so using preferred or most relevant."
          );
          matchingLogin = orderedEntriesWithPreference.find((e) => e.isPreferredMatch) || orderedEntriesWithPreference[0];
          multipleMatches = true;
          checkMatchingLoginRelevanceThreshold = true;
        }
        if (automated && checkMatchingLoginRelevanceThreshold && matchingLogin != null) {
          if (matchingLogin.relevanceScore < 1) {
            this.Logger.info(
              "Our selected entry is not relevant enough to exceed our threshold so will not be auto-filled."
            );
            matchingLogin = null;
          } else if (matchingLogin.lowFieldMatchRatio) {
            this.Logger.info(
              "Our selected entry has a low field match ratio so will not be auto-filled."
            );
            matchingLogin = null;
          }
        }
        if (matchingLogin != null) {
          const autoFillEnabled = isMatchedLoginRequest || (automated && multipleMatches && !this.config.autoFillFormsWithMultipleMatches ? false : this.config.autoFillForms);
          const autoSubmitEnabled = isMatchedLoginRequest ? this.config.autoSubmitMatchedForms : this.config.autoSubmitForms;
          action = { fill: autoFillEnabled, submit: autoSubmitEnabled };
          if (!isMatchedLoginRequest) {
            if (matchingLogin.alwaysAutoFill)
              action.fill = true;
            if (matchingLogin.neverAutoFill)
              action.fill = false;
          }
          if (!isMatchedLoginRequest || !this.config.manualSubmitOverrideProhibited) {
            if (matchingLogin.alwaysAutoSubmit)
              action.submit = true;
            if (matchingLogin.neverAutoSubmit)
              action.submit = false;
          }
          if (action.fill || matchResult.mustAutoFillForm) {
            this.Logger.debug("Going to auto-fill a form");
            const features = this.store.state.KeePassDatabases.find(
              (db) => db.fileName === matchingLogin.database.fileName
            ).sessionFeatures;
            const scoreConfig = {
              punishWrongIDAndName: features.indexOf("KPRPC_FIELD_DEFAULT_NAME_AND_ID_EMPTY") >= 0
            };
            const lastFilledOther = this.fillManyFormFields(
              otherFields,
              matchingLogin.fields.filter((f) => f.type !== "password"),
              -1,
              scoreConfig,
              automated
            );
            const lastFilledPasswords = this.fillManyFormFields(
              passwordFields,
              matchingLogin.fields.filter((f) => f.type === "password"),
              -1,
              scoreConfig,
              automated
            );
            matchResult.formReadyForSubmit = true;
            matchResult.lastFilledPasswords = lastFilledPasswords;
            matchResult.lastFilledOther = lastFilledOther;
            if (lastFilledPasswords && lastFilledPasswords.length > 0) {
              submitTargetNeighbour = lastFilledPasswords[0].DOMelement;
            } else if (lastFilledOther && lastFilledOther.length > 0) {
              submitTargetNeighbour = lastFilledOther[0].DOMelement;
            }
            this.formSaving.updateMatchResult(matchResult);
          }
        }
      }
      if (matchResult.formReadyForSubmit) {
        if (matchResult.UUID == void 0 || matchResult.UUID == null || matchResult.UUID == "") {
          this.Logger.debug("Syncing UUID to: " + matchingLogin.uuid);
          matchResult.UUID = matchingLogin.uuid;
          matchResult.dbFileName = matchingLogin.database.fileName;
        }
      }
      if (!matchResult.cannotAutoSubmitForm && (action.submit || matchResult.mustAutoSubmitForm) && matchResult.formReadyForSubmit) {
        this.Logger.info("Auto-submitting form...");
        this.submitForm(form, submitTargetNeighbour);
      } else if (isMatchedLoginRequest) {
        this.Logger.debug("Matched entry request is not being auto-submitted.");
      } else {
        if (this.matchResult.allMatchingLogins.length > 0) {
          if (automated) {
            this.Logger.debug("Automatic form fill complete.");
          } else {
            this.Logger.debug("Manual form fill complete.");
          }
        } else {
          this.Logger.info("Nothing to fill.");
        }
      }
    }
    sortMatchedEntries(entries) {
      return entries.map((e) => new Entry({ ...e })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    flagUserPreferredEntry(orderedEntries) {
      const url = new URL(window.document.URL);
      url.hostname = punycode.toUnicode(url.hostname);
      const conf = configManager.siteConfigFor(url.href);
      return orderedEntries.map(
        (e) => new Entry({
          ...e,
          isPreferredMatch: conf.preferredEntryUuid === e.uuid ? true : false
        })
      );
    }
    findSubmitButton(form, submitTargetNeighbour) {
      const candidates = [];
      const DISTANCE_MAX_SCORE = 100;
      const DISTANCE_DIFFERENCE_FACTOR = 20;
      const VISIBLE_SCORE = 60;
      const CAT_BUTTONINFORM_SCORE = 60;
      const CAT_SUBMITINPUTINFORM_SCORE = 50;
      const CAT_BUTTONOUTSIDEFORM_SCORE = 40;
      const CAT_IMAGEINPUTINFORM_SCORE = 40;
      const CAT_BUTTONINPUTINFORM_SCORE = 30;
      const CAT_BUTTONROLEINFORM_SCORE = 20;
      const CAT_BUTTONROLEOUTSIDEFORM_SCORE = 10;
      let minScoreToWin = 0;
      const distanceCalc = (v, t) => this.commonAncestorDistance(v, t, distanceMap);
      const distanceMap = /* @__PURE__ */ new Map();
      const fUtils = this.formUtils;
      function verifyPotentialCandidate(value, score) {
        if (minScoreToWin > score + VISIBLE_SCORE + DISTANCE_MAX_SCORE)
          return;
        const isVisible = fUtils.isDOMElementVisible(value);
        if (isVisible || !fUtils.isDOMElementVisible(submitTargetNeighbour)) {
          score += VISIBLE_SCORE;
        }
        if (minScoreToWin > score + DISTANCE_MAX_SCORE)
          return;
        candidates.push({
          distance: distanceCalc(value, submitTargetNeighbour),
          element: value,
          score
        });
        minScoreToWin = score;
      }
      function resolveAriaLabelValues(element) {
        var _a;
        const labels = [];
        if (element.hasAttribute("aria-label")) {
          labels.push(element.getAttribute("aria-label").toLowerCase());
        }
        (_a = element.getAttribute("aria-labelledby")) == null ? void 0 : _a.trim().split(" ").forEach((id) => {
          if (id) {
            const labelElement = form.ownerDocument.getElementById(id);
            if (labelElement && labelElement.innerText) {
              labels.push(labelElement.innerText.toLowerCase());
            }
          }
        });
        return labels;
      }
      Array.from(form.ownerDocument.getElementsByTagName("button")).forEach((value) => {
        if (!value.isConnected)
          return;
        if (!value.type || value.type != "reset") {
          const semanticValues = [];
          if (value.name)
            semanticValues.push(value.name.toLowerCase());
          if (value.textContent)
            semanticValues.push(value.textContent.toLowerCase());
          if (value.value)
            semanticValues.push(value.value.toLowerCase());
          semanticValues.push(...resolveAriaLabelValues(value));
          let score = this.scoreAdjustmentForMagicWords(
            semanticValues,
            50,
            this.semanticWhitelistCache,
            this.semanticBlacklistCache
          );
          score += value.form && value.form == form ? CAT_BUTTONINFORM_SCORE : CAT_BUTTONOUTSIDEFORM_SCORE;
          verifyPotentialCandidate(value, score);
        }
      });
      Array.from(form.getElementsByTagName("input")).forEach((value) => {
        if (!value.isConnected)
          return;
        if (value.type != null) {
          let semanticScore = 0;
          if (value.type == "submit" || value.type == "button") {
            if (value.name) {
              semanticScore += this.scoreAdjustmentForMagicWords(
                [value.name.toLowerCase()],
                50,
                this.semanticWhitelistCache,
                this.semanticBlacklistCache
              );
            }
            const semanticValues = [];
            if (value.value) {
              semanticValues.push(value.value.toLowerCase());
            }
            semanticValues.push(...resolveAriaLabelValues(value));
            if (semanticValues.length > 0) {
              semanticScore += this.scoreAdjustmentForMagicWords(
                semanticValues,
                40,
                this.semanticWhitelistCache,
                this.semanticBlacklistCache
              );
            }
            if (value.id) {
              semanticScore += this.scoreAdjustmentForMagicWords(
                [value.id.toLowerCase()],
                20,
                this.semanticWhitelistCache,
                this.semanticBlacklistCache
              );
            }
          }
          if (value.type == "submit" || value.type == "button" || value.type == "image") {
            let score = semanticScore;
            score += value.type == "button" ? CAT_BUTTONINPUTINFORM_SCORE : value.type == "image" ? CAT_IMAGEINPUTINFORM_SCORE : CAT_SUBMITINPUTINFORM_SCORE;
            verifyPotentialCandidate(value, score);
          }
        }
      });
      Array.from(form.ownerDocument.querySelectorAll("[role=button]:not(button)")).forEach(
        (value) => {
          if (!value.isConnected)
            return;
          const semanticValues = [];
          if (value.name)
            semanticValues.push(value.name.toLowerCase());
          if (value.id)
            semanticValues.push(value.id.toLowerCase());
          if (value.title)
            semanticValues.push(value.title.toLowerCase());
          if (value.innerText)
            semanticValues.push(value.innerText.toLowerCase());
          if (value.dataSet && value.dataSet.length > 0) {
            if (value.dataSet.tooltip) {
              semanticValues.push(value.dataSet.tooltip.toLowerCase());
            }
          }
          semanticValues.push(...resolveAriaLabelValues(value));
          let score = this.scoreAdjustmentForMagicWords(
            semanticValues,
            50,
            this.semanticWhitelistCache,
            this.semanticBlacklistCache
          );
          score += value.form && value.form == form ? CAT_BUTTONROLEINFORM_SCORE : CAT_BUTTONROLEOUTSIDEFORM_SCORE;
          verifyPotentialCandidate(value, score);
        }
      );
      if (candidates.length <= 0)
        return null;
      if (candidates.length === 1)
        return candidates[0].element;
      const submitElements = candidates.sort((a, b) => {
        if (a.distance > b.distance)
          return -1;
        if (a.distance < b.distance)
          return 1;
        return 0;
      });
      const maxDistanceDifference = submitElements[0].distance - submitElements[submitElements.length - 1].distance;
      const distanceScore = Math.min(
        DISTANCE_MAX_SCORE,
        DISTANCE_DIFFERENCE_FACTOR * maxDistanceDifference
      );
      let distanceFactor = 1 / submitElements.length;
      let lastDistance = submitElements[0].distance;
      submitElements.forEach((candidate, index, elements) => {
        if (candidate.distance < lastDistance) {
          distanceFactor = (index + 1) / elements.length;
          lastDistance = candidate.distance;
        }
        candidate.score += distanceFactor * distanceScore;
      });
      let maxScore = submitElements[0].score;
      let maxScoreElement = submitElements[0].element;
      for (let i = 1; i < submitElements.length; i++) {
        if (submitElements[i].score > maxScore) {
          maxScore = submitElements[i].score;
          maxScoreElement = submitElements[i].element;
        }
      }
      return maxScoreElement;
    }
    scoreAdjustmentForMagicWords(semanticValues, factor, semanticWhitelistCache, semanticBlacklistCache) {
      const goodWords = [
        "submit",
        "login",
        "enter",
        "log in",
        "signin",
        "sign in",
        "next",
        "continue"
      ];
      const badWords = [
        "reset",
        "cancel",
        "back",
        "abort",
        "undo",
        "exit",
        "empty",
        "clear",
        "captcha",
        "totp",
        "forgot",
        "dismiss",
        "delete",
        "show",
        "reveal"
      ];
      let goodScore = false;
      let badScore = false;
      for (let i = 0; i < semanticValues.length; i++) {
        if (goodScore)
          break;
        if (!semanticValues[i])
          continue;
        const semanticValue = semanticValues[i].trim();
        if (!semanticValue)
          continue;
        if (semanticWhitelistCache[semanticValue] === true) {
          goodScore = true;
          break;
        }
        if (semanticWhitelistCache[semanticValue] === false) {
          continue;
        }
        for (let j = 0; j < goodWords.length; j++) {
          if (semanticValue.indexOf(goodWords[j]) >= 0) {
            goodScore = true;
            semanticWhitelistCache[semanticValue] = true;
            break;
          } else {
            semanticWhitelistCache[semanticValue] = false;
          }
        }
      }
      for (let i = 0; i < semanticValues.length; i++) {
        if (badScore)
          break;
        if (!semanticValues[i])
          continue;
        const semanticValue = semanticValues[i].trim();
        if (!semanticValue)
          continue;
        if (semanticBlacklistCache[semanticValue] === true) {
          badScore = true;
          break;
        }
        if (semanticBlacklistCache[semanticValue] === false) {
          continue;
        }
        for (let j = 0; j < badWords.length; j++) {
          if (semanticValue.indexOf(badWords[j]) >= 0) {
            badScore = true;
            semanticBlacklistCache[semanticValue] = true;
            break;
          } else {
            semanticBlacklistCache[semanticValue] = false;
          }
        }
      }
      if (goodScore && badScore)
        return 0;
      if (badScore)
        return -1 * factor;
      if (goodScore)
        return factor;
      return 0;
    }
    commonAncestorDistance(nodeA, nodeB, distanceMap) {
      let distance = 1;
      let found = false;
      const pendingMap = [];
      let pendingMapStartDistance = 0;
      while (nodeA = nodeA.parentElement) {
        const cachedNodeDistance = distanceMap.get(nodeA);
        if (cachedNodeDistance !== void 0) {
          distance += cachedNodeDistance;
          pendingMapStartDistance = cachedNodeDistance + 1;
          found = true;
          break;
        }
        pendingMap.push(nodeA);
        if (nodeA.contains(nodeB)) {
          found = true;
          break;
        }
        distance++;
      }
      if (found) {
        if (pendingMap.length > 0) {
          for (let i = pendingMapStartDistance; i < distance && pendingMap.length > 0; i++) {
            const node = pendingMap.pop();
            distanceMap.set(node, i);
          }
        }
        return distance;
      } else {
        return 9007199254740991;
      }
    }
    // Submit a form
    submitForm(form, submitTargetNeighbour) {
      const submitElement = this.findSubmitButton(form, submitTargetNeighbour);
      this.formSaving.removeAllSubmitHandlers();
      if (submitElement != null) {
        this.Logger.debug(
          "Submiting using element: " + submitElement.name + ": " + submitElement.id
        );
        submitElement.click();
      } else {
        this.Logger.debug("Submiting using form");
        form.submit();
      }
    }
    calculateRelevanceScore(entry, passwordFields, otherFields, currentPage, formVisible, scoreConfig, visibleFieldCache) {
      let score = 0;
      let lowFieldMatchRatio = false;
      score += entry.matchAccuracy;
      if (!formVisible)
        score -= 20;
      const minMatchedFieldCountRatio = 0.501;
      const [otherRelevanceScore, otherFieldMatchSuccesses] = this.determineRelevanceScores(
        "other",
        otherFields,
        entry.fields.filter((f) => f.type !== "password"),
        currentPage,
        scoreConfig,
        visibleFieldCache.other
      );
      const [passwordRelevanceScore, passwordFieldMatchSuccesses] = this.determineRelevanceScores(
        "password",
        passwordFields,
        entry.fields.filter((f) => f.type === "password"),
        currentPage,
        scoreConfig,
        visibleFieldCache.password
      );
      const totalRelevanceScore = otherRelevanceScore + passwordRelevanceScore;
      const formFieldCount = passwordFields.concat(otherFields).filter((f) => f.field.locators[0].id || f.field.locators[0].name || f.field.value).length;
      const loginFieldCount = entry.fields.filter(
        (f) => f.locators[0].id || f.locators[0].name || f.value
      ).length;
      const formFieldCountForAutofill = passwordFields.concat(otherFields).filter(
        (f) => (f.field.type === "password" || f.field.type === "text") && (f.field.locators[0].id || f.field.locators[0].name)
      ).length;
      const loginFieldCountForAutofill = entry.fields.filter(
        (f) => (f.type === "password" || f.type === "text") && (f.locators[0].id || f.locators[0].name || f.value)
      ).length;
      const formMatchedFieldCountForAutofill = otherFieldMatchSuccesses.filter((s) => s === true).length + passwordFieldMatchSuccesses.filter((s) => s === true).length;
      const numberOfNewPasswordFields = passwordFields.filter(
        (f) => {
          var _a;
          return (_a = f.field.locators[0].autocompleteValues) == null ? void 0 : _a.some((v) => v === "new-password");
        }
      ).length;
      const fieldMatchRatioForAutofill = Math.min(
        loginFieldCountForAutofill + numberOfNewPasswordFields,
        formMatchedFieldCountForAutofill
      ) / Math.max(1, formFieldCountForAutofill);
      this.Logger.debug(
        "formFieldCount: " + formFieldCount + ", loginFieldCount: " + loginFieldCount + ", loginFieldCountForAutofill: " + loginFieldCountForAutofill + ", formFieldCountForAutofill: " + formFieldCountForAutofill + ", formMatchedFieldCountForAutofill: " + formMatchedFieldCountForAutofill + ", numberOfNewPasswordFields: " + numberOfNewPasswordFields + ", fieldMatchRatio: " + fieldMatchRatioForAutofill
      );
      if (fieldMatchRatioForAutofill < minMatchedFieldCountRatio) {
        this.Logger.info(
          entry.uuid + " will be forced to not auto-fill because the form field match ratio (" + fieldMatchRatioForAutofill + ") is not high enough."
        );
        lowFieldMatchRatio = true;
      }
      const averageFieldRelevance = totalRelevanceScore / Math.max(formFieldCount, loginFieldCount);
      const adjustedRelevance = averageFieldRelevance / (Math.abs(formFieldCount - loginFieldCount) + 1);
      score += adjustedRelevance;
      this.Logger.info("Relevance for " + entry.uuid + " is: " + score);
      return { score, lowFieldMatchRatio };
    }
    determineRelevanceScores(debugName, matchedFields, entryFields, currentPage, scoreConfig, visibleFieldMap) {
      var _a;
      let totalRelevanceScore = 0;
      const minFieldRelevance = 1;
      const fieldMatchSuccesses = [];
      for (let i = 0; i < matchedFields.length; i++) {
        let mostRelevantScore = 0;
        const formField = matchedFields[i].field;
        if ((_a = formField.locators[0].autocompleteValues) == null ? void 0 : _a.some((v) => v === "new-password")) {
          fieldMatchSuccesses[i] = true;
        }
        for (let j = 0; j < entryFields.length; j++) {
          const fmScore = this.calculateFieldMatchScore(
            matchedFields[i],
            entryFields[j],
            currentPage,
            scoreConfig,
            visibleFieldMap[i]
          );
          this.Logger.debug(
            "Suitability of putting " + debugName + " field " + j + " into form field " + i + " (id: " + formField.locators[0].id + ") is " + fmScore
          );
          if (fmScore > mostRelevantScore) {
            mostRelevantScore = fmScore;
          }
          const fmScoreForRatio = fmScore - (visibleFieldMap[i] ? 0 : 10);
          if ((formField.type === "text" || formField.type === "password") && fmScoreForRatio >= minFieldRelevance && entryFields[j].value && !fieldMatchSuccesses[i]) {
            fieldMatchSuccesses[i] = true;
          }
          if (matchedFields[i].highestScore == null || fmScore > matchedFields[i].highestScore) {
            matchedFields[i].highestScore = fmScore;
          }
        }
        totalRelevanceScore += mostRelevantScore;
      }
      return [totalRelevanceScore, fieldMatchSuccesses];
    }
    removeKeeIconFromAllFields() {
      this.keeFieldIcon.removeKeeIconFromAllFields();
    }
  }
  class MatchedField {
  }
  class FormUtils {
    constructor(logger) {
      this.findLoginOps = [];
      this.matchResults = [];
      this.Logger = logger;
    }
    countAllDocuments(frame) {
      if (!this.isUriWeCanFill(frame.location))
        return 0;
      let localDocCount = 1;
      if (frame.frames.length > 0) {
        const frames = frame.frames;
        for (let i = 0; i < frames.length; i++) {
          localDocCount += this.countAllDocuments(frames[i]);
        }
      }
      return localDocCount;
    }
    isUriWeCanFill(uri) {
      if (uri.protocol == "http:" || uri.protocol == "https:" || uri.protocol == "file:") {
        return true;
      }
      return false;
    }
    isATextFormFieldType(type) {
      if (type == "checkbox" || type == "select-one" || type == "radio" || type == "password" || type == "hidden" || type == "submit" || type == "button" || type == "file" || type == "image" || type == "reset") {
        return false;
      } else
        return true;
    }
    isAKnownUsernameString(fieldNameIn) {
      const fieldName = fieldNameIn.toLowerCase();
      if (fieldName == "username" || fieldName == "j_username" || fieldName == "user_name" || fieldName == "user" || fieldName == "user-name" || fieldName == "login" || fieldName == "vb_login_username" || fieldName == "name" || fieldName == "user name" || fieldName == "user id" || fieldName == "user-id" || fieldName == "userid" || fieldName == "email" || fieldName == "e-mail" || fieldName == "id" || fieldName == "form_loginname" || fieldName == "wpname" || fieldName == "mail" || fieldName == "loginid" || fieldName == "login id" || fieldName == "login_name" || fieldName == "openid_identifier" || fieldName == "authentication_email" || fieldName == "openid" || fieldName == "auth_email" || fieldName == "auth_id" || fieldName == "authentication_identifier" || fieldName == "authentication_id" || fieldName == "customer_number" || fieldName == "customernumber" || fieldName == "onlineid") {
        return true;
      }
      return false;
    }
    /*
     * getFormFields
     *
     * Returns the usernameIndex and password fields found in the form.
     * Can handle complex forms by trying to figure out what the
     * relevant fields are.
     *
     * Returns: [usernameIndex, passwords, ...]
     * all arrays are standard javascript arrays
     * usernameField may be null.
     */
    getFormFields(form, isSubmission, maximumFieldCount) {
      var _a;
      const pwFields = [];
      const otherFields = [];
      const allFields = [];
      let firstPasswordIndex = -1;
      let firstPossibleUsernameIndex = -1;
      let usernameIndex = -1;
      const totalElements = form.elements.length;
      const elementLimit = totalElements < 2e3 ? totalElements : 2e3;
      for (let i = 0; i < elementLimit; i++) {
        if (allFields.length > maximumFieldCount) {
          throw new Error("Too many fields");
        }
        if (form.elements[i].localName.toLowerCase() == "object" || form.elements[i].localName.toLowerCase() == "keygen" || form.elements[i].localName.toLowerCase() == "output" || form.elements[i].localName.toLowerCase() != "input" && (form.elements[i].type == void 0 || form.elements[i].type == null)) {
          continue;
        }
        const domType = form.elements[i].type.toLowerCase();
        if (domType == "fieldset")
          continue;
        if (domType != "password" && !this.isATextFormFieldType(domType) && domType != "checkbox" && domType != "radio" && domType != "select-one") {
          continue;
        }
        if (domType == "radio" && isSubmission && form.elements[i].checked == false)
          continue;
        if (domType == "password" && isSubmission && !form.elements[i].value)
          continue;
        if (domType == "select-one" && isSubmission && !form.elements[i].value)
          continue;
        this.Logger.debug(`processing field with domtype ${domType}...`);
        allFields[allFields.length] = {
          index: i,
          element: new MatchedField(),
          type: domType
        };
        let fieldValue = form.elements[i].value;
        if (domType == "checkbox") {
          if (form.elements[i].checked)
            fieldValue = "KEEFOX_CHECKED_FLAG_TRUE";
          else
            fieldValue = "KEEFOX_CHECKED_FLAG_FALSE";
        }
        const field = Field.fromDOM(form.elements[i], domType, fieldValue);
        allFields[allFields.length - 1].element.field = field;
        allFields[allFields.length - 1].element.DOMelement = form.elements[i];
        if (domType == "password" && firstPasswordIndex == -1) {
          firstPasswordIndex = allFields.length - 1;
        }
        if (this.isATextFormFieldType(domType) && firstPossibleUsernameIndex == -1 && (this.isAKnownUsernameString(form.elements[i].name) || ((_a = field.locators[0].labels) == null ? void 0 : _a.some((label) => this.isAKnownUsernameString(label))))) {
          firstPossibleUsernameIndex = allFields.length - 1;
        }
        if (form.elements[i].keeInitialDetectedValue == null) {
          form.elements[i].keeInitialDetectedValue = fieldValue;
        }
      }
      if (firstPossibleUsernameIndex != -1)
        usernameIndex = firstPossibleUsernameIndex;
      else if (firstPasswordIndex > 0)
        usernameIndex = firstPasswordIndex - 1;
      this.Logger.debug("usernameIndex: " + usernameIndex);
      let otherCount = 0;
      let actualUsernameIndex = 0;
      for (let i = 0; i < allFields.length; i++) {
        if (allFields[i].type == "password")
          pwFields[pwFields.length] = allFields[i].element;
        else if (this.isATextFormFieldType(allFields[i].type) || allFields[i].type == "checkbox" || allFields[i].type == "radio" || allFields[i].type == "select-one") {
          otherFields[otherFields.length] = allFields[i].element;
          if (i == usernameIndex)
            actualUsernameIndex = otherCount;
          else
            otherCount++;
        }
      }
      this.Logger.debug("actualUsernameIndex: " + actualUsernameIndex);
      this.Logger.debug("otherFields.length:" + otherFields.length);
      return {
        actualUsernameIndex,
        pwFields,
        otherFields
      };
    }
    // A basic, slightly flawed but fast visibility test
    isDOMElementVisible(element) {
      if (!element.offsetParent && element.offsetHeight === 0 && element.offsetWidth === 0) {
        return false;
      }
      return true;
    }
    // // used for multipage stuff that we might not be able to support yet in webextensions
    // resetFormFillSession () {
    //     if (resetFormFillTimer != null) {
    //         clearTimeout(resetFormFillTimer);
    //         resetFormFillTimer = null;
    //     }
    //     tabState.currentPage = 0;
    //     tabState.maximumPage = 0;
    //     tabState.forceAutoSubmit = null;
    //     tabState.userRecentlyDemandedAutoSubmit = false;
    //     Logger.debug("Reset form-filling session (page = 0 and cancelled any forced autosubmit).");
    // };
    //var resetFormFillTimer = null;
  }
  class FormSaving {
    //TODO:4: May be overkill to have all this data available for saving
    constructor(myPort, logger, formUtils2) {
      this.myPort = myPort;
      this.SubmitHandlerAttachments = [];
      this.Logger = logger;
      this.formUtils = formUtils2;
    }
    addSubmitHandler(target, formToSubmit) {
      const handler = (e) => this.submitHandler(e, formToSubmit);
      this.SubmitHandlerAttachments.push({
        target,
        form: formToSubmit,
        handler
      });
      if (target)
        target.addEventListener("click", handler);
      formToSubmit.addEventListener("submit", handler);
    }
    removeAllSubmitHandlers() {
      this.SubmitHandlerAttachments.forEach((attachment) => {
        if (attachment.target) {
          attachment.target.removeEventListener("click", attachment.handler);
        }
        attachment.form.removeEventListener("submit", attachment.handler);
      });
      this.SubmitHandlerAttachments = [];
    }
    updateMatchResult(matchResult) {
      this.matchResult = matchResult;
    }
    // This won't always be called before all event handlers on the web page so on
    // some sites we will store invalid data (in cases where the login scripts
    // mangle the contents of the fields before submitting them).
    //TODO:4: Possibly could slightly reduce incidence of this problem by listening
    // to every click on the document body or tracking all input events but performance?
    submitHandler(_e, form) {
      this.Logger.debug("submitHandler called");
      this.removeAllSubmitHandlers();
      const doc = form.ownerDocument;
      const url = new URL(doc.URL);
      url.hostname = punycode.toUnicode(url.hostname);
      const conf = configManager.siteConfigFor(url.href);
      if (conf.preventSaveNotification)
        return;
      let isPasswordChangeForm = false;
      let isRegistrationForm = false;
      const passwordFields = [];
      let scanResult;
      try {
        scanResult = this.formUtils.getFormFields(form, true, 50);
      } catch (ex) {
        this.Logger.warn("Lost interest in this form after finding too many fields" + ex);
        return;
      }
      const usernameIndex = scanResult.actualUsernameIndex;
      const passwords = scanResult.pwFields;
      const otherFields = scanResult.otherFields;
      if (passwords.length > 1) {
        let twoPasswordsMatchIndex = -1;
        for (let i = 0; i < passwords.length && twoPasswordsMatchIndex == -1; i++) {
          for (let j = i + 1; j < passwords.length && twoPasswordsMatchIndex == -1; j++) {
            if (passwords[j].field.value == passwords[i].field.value) {
              twoPasswordsMatchIndex = j;
            }
          }
        }
        if (twoPasswordsMatchIndex == -1) {
          this.Logger.debug("multiple passwords found (with no identical values)");
          for (let i = 0; i < passwords.length; i++)
            passwordFields.push(passwords[i]);
        } else {
          this.Logger.debug(
            "Looks like a password change form or new registration form has been submitted"
          );
          if (passwords.length == 2) {
            passwordFields.push(passwords[0]);
            isPasswordChangeForm = false;
            isRegistrationForm = true;
          } else {
            isPasswordChangeForm = false;
            isRegistrationForm = false;
            passwordFields.push(passwords[twoPasswordsMatchIndex]);
          }
        }
      } else if (passwords != null && passwords[0] != null && passwords[0] != void 0) {
        passwordFields.push(passwords[0]);
      }
      const nonEmptyPasswordFields = this.removeEmptyFields(passwordFields);
      const nonEmptyOtherFields = this.removeEmptyFields(otherFields);
      const differentPassword = !this.matchResult || !this.matchResult.lastFilledPasswords || this.hasFieldBeenModified(nonEmptyPasswordFields, this.matchResult.lastFilledPasswords);
      const differentOther = !this.matchResult || !this.matchResult.lastFilledOther || this.hasFieldBeenModified(nonEmptyOtherFields, this.matchResult.lastFilledOther);
      if (differentPassword || differentOther) {
        const submittedData = {
          url: url.href,
          fields: Field.combineDomFieldLists(
            usernameIndex,
            nonEmptyOtherFields.map((f) => f.field),
            nonEmptyPasswordFields.map((f) => f.field)
          ),
          title: doc.title || url.hostname,
          isPasswordChangeForm,
          isRegistrationForm
        };
        this.myPort.postMessage({ submittedData });
      }
    }
    removeEmptyFields(fields) {
      return fields.filter((f) => f.field.value || f.field.type === "boolean");
    }
    hasFieldBeenModified(newlySubmittedFields, previouslyFilledFields) {
      return !!previouslyFilledFields.find((filledField) => {
        const submittedField = newlySubmittedFields.find(
          (f) => filledField.DOMelement == f.DOMelement
        );
        if (!submittedField)
          return true;
        if (submittedField.field.value != filledField.value)
          return true;
        return false;
      });
    }
  }
  const panelOptions = PanelStubOptions.GeneratePassword;
  class PasswordGenerator {
    constructor(parentFrameId) {
      this.parentFrameId = parentFrameId;
    }
    createGeneratePasswordPanel() {
      this.closeGeneratePasswordPanel();
      this.generatePasswordPanelStub = new PanelStub(panelOptions, null, this.parentFrameId);
      this.generatePasswordPanelStub.createPanel();
    }
    createGeneratePasswordPanelNearNode(target) {
      this.closeGeneratePasswordPanel();
      this.generatePasswordPanelStub = new PanelStub(panelOptions, target, this.parentFrameId);
      this.generatePasswordPanelStub.createPanel();
      this.generatePasswordPanelStubRaf = requestAnimationFrame(
        () => this.updateGeneratePasswordPanelPosition()
      );
    }
    closeGeneratePasswordPanel() {
      if (this.generatePasswordPanelStub)
        this.generatePasswordPanelStub.closePanel();
      this.generatePasswordPanelStub = null;
      cancelAnimationFrame(this.generatePasswordPanelStubRaf);
    }
    updateGeneratePasswordPanelPosition() {
      this.generatePasswordPanelStub.updateBoundingClientRect();
      this.generatePasswordPanelStubRaf = requestAnimationFrame(
        () => this.updateGeneratePasswordPanelPosition()
      );
    }
  }
  class ContentPortManager {
    // public mixin = {
    //     methods: {
    //         postMessage: msg => {
    //             this.port.postMessage(msg);
    //         }
    //     }
    // };
    postMessage(msg) {
      this.port.postMessage(msg);
    }
    startup(name) {
      this.port = browserPolyfillExports.runtime.connect({ name });
    }
    shutdown() {
      this.port = null;
    }
    get raw() {
      return this.port;
    }
  }
  const Port = new ContentPortManager();
  const updateActiveKeePassDatabaseIndex = "updateActiveKeePassDatabaseIndex";
  const updateConnected = "updateConnected";
  const updateConnectedWebsocket = "updateConnectedWebsocket";
  const updateCurrentSearchTerm = "updateCurrentSearchTerm";
  const updateLatestConnectionError = "updateLatestConnectionError";
  const updateLastKeePassRPCRefresh = "updateLastKeePassRPCRefresh";
  const updateKeePassDatabases = "updateKeePassDatabases";
  const updatePasswordProfiles = "updatePasswordProfiles";
  const updateGeneratedPassword = "updateGeneratedPassword";
  const updateNotifications = "updateNotifications";
  const updateSubmittedData = "updateSubmittedData";
  const updateLoginsFound = "updateLoginsFound";
  const updateSearchResultWithFullDetails = "updateSearchResultWithFullDetails";
  const updateSearchResults = "updateSearchResults";
  const addNotification = "addNotification";
  const updateSaveState = "updateSaveState";
  const updateSaveEntryResult = "updateSaveEntryResult";
  const removeFieldFromActiveEntry = "removeFieldFromActiveEntry";
  const updateEntryUpdateStartedAtTimestamp = "updateEntryUpdateStartedAtTimestamp";
  class SaveState {
    constructor() {
      this.newEntry = new Entry({});
    }
  }
  const defaults = {
    latestConnectionError: "",
    lastKeePassRPCRefresh: 0,
    ActiveKeePassDatabaseIndex: -1,
    KeePassDatabases: [],
    PasswordProfiles: [],
    notifications: [],
    connected: false,
    connectedWebsocket: false,
    currentSearchTerm: null,
    loginsFound: false,
    searchResults: null,
    saveState: new SaveState(),
    generatedPassword: "",
    saveEntryResult: {
      result: null,
      receivedAt: /* @__PURE__ */ new Date(),
      fileName: null,
      uuid: null
    },
    entryUpdateStartedAtTimestamp: 0
  };
  class Mutation {
    constructor(type, payload) {
      this.type = type;
      this.payload = payload;
    }
  }
  function undefAbort(payload) {
    if (payload === void 0) {
      throw new Error(
        "FATAL! undefined value sent to commit that must never set an undefined value. No-one knows what will happen now but Kee is probably broken in some way until a browser restart."
      );
    }
  }
  class NonReactiveStore {
    constructor(distributeAction) {
      this.distributeAction = distributeAction;
      this._state = defaults;
    }
    get state() {
      return this._state;
    }
    onRemoteMessage(sourcePort, mutation) {
      if (mutation.type === addNotification) {
        this.addNotification(mutation.payload, false);
      } else if (mutation.type === removeFieldFromActiveEntry) {
        this.removeFieldFromActiveEntry(mutation.payload, false);
      } else if (mutation.type === updateActiveKeePassDatabaseIndex) {
        this.updateActiveKeePassDatabaseIndex(mutation.payload, false);
      } else if (mutation.type === updateConnected) {
        this.updateConnected(mutation.payload, false);
      } else if (mutation.type === updateConnectedWebsocket) {
        this.updateConnectedWebsocket(mutation.payload, false);
      } else if (mutation.type === updateCurrentSearchTerm) {
        this.updateCurrentSearchTerm(mutation.payload, false);
      } else if (mutation.type === updateEntryUpdateStartedAtTimestamp) {
        this.updateEntryUpdateStartedAtTimestamp(mutation.payload, false);
      } else if (mutation.type === updateGeneratedPassword) {
        this.updateGeneratedPassword(mutation.payload, false);
      } else if (mutation.type === updateKeePassDatabases) {
        this.updateKeePassDatabases(mutation.payload, false);
      } else if (mutation.type === updateLastKeePassRPCRefresh) {
        this.updateLastKeePassRPCRefresh(mutation.payload, false);
      } else if (mutation.type === updateLatestConnectionError) {
        this.updateLatestConnectionError(mutation.payload, false);
      } else if (mutation.type === updateLoginsFound) {
        this.updateLoginsFound(mutation.payload, false);
      } else if (mutation.type === updateNotifications) {
        this.updateNotifications(mutation.payload, false);
      } else if (mutation.type === updatePasswordProfiles) {
        this.updatePasswordProfiles(mutation.payload, false);
      } else if (mutation.type === updateSaveEntryResult) {
        this.updateSaveEntryResult(mutation.payload, false);
      } else if (mutation.type === updateSaveState) {
        this.updateSaveState(mutation.payload, false);
      } else if (mutation.type === updateSearchResultWithFullDetails) {
        this.updateSearchResultWithFullDetails(mutation.payload, false);
      } else if (mutation.type === updateSearchResults) {
        this.updateSearchResults(mutation.payload, false);
      } else if (mutation.type === updateSubmittedData) {
        this.updateSubmittedData(mutation.payload, false);
      }
    }
    resetTo(s) {
      this._state = s;
    }
    updateActiveKeePassDatabaseIndex(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.ActiveKeePassDatabaseIndex = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateActiveKeePassDatabaseIndex, payload));
    }
    updateConnected(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.connected = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateConnected, payload));
    }
    updateConnectedWebsocket(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.connectedWebsocket = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateConnectedWebsocket, payload));
    }
    updateCurrentSearchTerm(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.currentSearchTerm = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateCurrentSearchTerm, payload));
    }
    updateKeePassDatabases(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.KeePassDatabases = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateKeePassDatabases, payload));
    }
    updateLastKeePassRPCRefresh(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.lastKeePassRPCRefresh = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLastKeePassRPCRefresh, payload));
    }
    updateLatestConnectionError(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.latestConnectionError = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLatestConnectionError, payload));
    }
    updateLoginsFound(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.loginsFound = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateLoginsFound, payload));
    }
    updateNotifications(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.notifications = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateNotifications, payload));
    }
    updatePasswordProfiles(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.PasswordProfiles = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updatePasswordProfiles, payload));
    }
    updateGeneratedPassword(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.generatedPassword = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateGeneratedPassword, payload));
    }
    updateSubmittedData(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      if (!this.state.saveState) {
        this.state.saveState = new SaveState();
      }
      this.state.saveState.submittedData = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSubmittedData, payload));
    }
    updateSaveState(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.saveState = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSaveState, payload));
    }
    updateSearchResults(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.searchResults = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSearchResults, payload));
    }
    updateSearchResultWithFullDetails(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      const id = payload.uuid;
      for (const s of this.state.searchResults) {
        if (s.uuid === id) {
          s.fullDetails = payload;
          break;
        }
      }
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSearchResultWithFullDetails, payload));
    }
    addNotification(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.notifications.push(payload);
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(addNotification, payload));
    }
    updateSaveEntryResult(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.saveEntryResult = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateSaveEntryResult, payload));
    }
    removeFieldFromActiveEntry(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      const firstTextFieldIndex = this.state.saveState.newEntry.fields.findIndex(
        (f) => f.type === "text"
      );
      const firstPasswordFieldIndex = this.state.saveState.newEntry.fields.findIndex(
        (f) => f.type === "password"
      );
      const originalFieldIndex = this.state.saveState.newEntry.fields.findIndex(
        (f) => f.uuid === payload
      );
      this.state.saveState.newEntry.fields.splice(originalFieldIndex, 1);
      if (originalFieldIndex === firstTextFieldIndex) {
        const newUsernameIndex = this.state.saveState.newEntry.fields.findIndex(
          (f) => f.type === "text"
        );
        if (newUsernameIndex >= 0) {
          const newUsername = this.state.saveState.newEntry.fields.splice(newUsernameIndex, 1)[0];
          this.state.saveState.newEntry.fields.splice(
            originalFieldIndex,
            0,
            new Field({ ...newUsername, name: "KeePass username" })
          );
        }
      } else if (originalFieldIndex === firstPasswordFieldIndex) {
        const newPasswordIndex = this.state.saveState.newEntry.fields.findIndex(
          (f) => f.type === "password"
        );
        if (newPasswordIndex >= 0) {
          const newPassword = this.state.saveState.newEntry.fields.splice(newPasswordIndex, 1)[0];
          this.state.saveState.newEntry.fields.splice(
            originalFieldIndex,
            0,
            new Field({ ...newPassword, name: "KeePass password" })
          );
        }
      }
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(removeFieldFromActiveEntry, payload));
    }
    updateEntryUpdateStartedAtTimestamp(payload, distribute = true) {
      var _a;
      undefAbort(payload);
      this.state.entryUpdateStartedAtTimestamp = payload;
      if (distribute)
        (_a = this.distributeAction) == null ? void 0 : _a.call(this, new Mutation(updateEntryUpdateStartedAtTimestamp, payload));
    }
  }
  var keeDuplicationCount;
  if (keeDuplicationCount) {
    if (KeeLog && KeeLog.error) {
      KeeLog.error(
        "Duplicate Kee content script instance detected! Found this many other instances: " + keeDuplicationCount
      );
    } else {
      console.error(
        "Duplicate Kee content script instance detected! Found this many other instances: " + keeDuplicationCount
      );
    }
  } else {
    keeDuplicationCount = 0;
  }
  keeDuplicationCount += 1;
  let formUtils;
  let formFilling;
  let formSaving;
  let passwordGenerator;
  let frameId;
  let connected = false;
  let messagingPortConnectionRetryTimer;
  let pageShowFired = false;
  let configReady = false;
  let missingPageShowTimer;
  let store;
  let inputsObserver;
  if (document.body) {
    let matchFinder = function(uri) {
      Port.postMessage({ findMatches: { uri } });
    }, tutorialIntegration = function() {
      var _a, _b, _c, _d, _e, _f;
      if (window.location.hostname.endsWith("tutorial-addon.kee.pm")) {
        const transferElement = document.createElement("KeeFoxAddonStateTransferElement");
        transferElement.setAttribute(
          "state",
          JSON.stringify({
            connected: ((_a = store == null ? void 0 : store.state) == null ? void 0 : _a.connected) || false,
            version: browserPolyfillExports.runtime.getManifest().version,
            dbLoaded: ((_c = (_b = store == null ? void 0 : store.state) == null ? void 0 : _b.KeePassDatabases) == null ? void 0 : _c.length) > 0,
            sessionNames: (_f = (_e = (_d = store == null ? void 0 : store.state) == null ? void 0 : _d.KeePassDatabases) == null ? void 0 : _e.map) == null ? void 0 : _f.call(
              _e,
              (db) => db.sessionType.toString()
            ).filter((v, i, a) => a.indexOf(v) === i)
          })
        );
        document.documentElement.appendChild(transferElement);
        const event = new Event("KeeFoxAddonStateTransferEvent", {
          bubbles: true,
          cancelable: false
        });
        transferElement.dispatchEvent(event);
      }
    }, onFirstConnect = function(myFrameId) {
      frameId = myFrameId;
      KeeLog.attachConfig(configManager.current);
      formUtils = new FormUtils(KeeLog);
      formSaving = new FormSaving(Port.raw, KeeLog, formUtils);
      formFilling = new FormFilling(
        store,
        Port.raw,
        frameId,
        formUtils,
        formSaving,
        KeeLog,
        configManager.current,
        matchFinder
      );
      passwordGenerator = new PasswordGenerator(frameId);
      inputsObserver.observe(document.body, { childList: true, subtree: true });
      tutorialIntegration();
    }, startup = function() {
      KeeLog.debug("content page starting");
      try {
        connectToMessagingPort();
        if (Port.raw == null) {
          KeeLog.warn("Failed to connect to messaging port. We'll try again later.");
        }
      } catch (ex) {
        KeeLog.warn(
          "Failed to connect to messaging port. We'll try again later. Exception message: " + ex.message
        );
      }
      messagingPortConnectionRetryTimer = window.setInterval(() => {
        if (Port.raw == null) {
          KeeLog.info("Messaging port was not established at page startup. Retrying now...");
          try {
            connectToMessagingPort();
            if (Port.raw == null) {
              KeeLog.warn("Failed to connect to messaging port. We'll try again later.");
            }
          } catch (ex) {
            KeeLog.warn(
              "Failed to connect to messaging port. We'll try again later. Exception message: " + ex.message
            );
          }
        } else {
          clearInterval(messagingPortConnectionRetryTimer);
        }
      }, 5e3);
      KeeLog.debug("content page ready");
    }, connectToMessagingPort = function() {
      if (Port.raw) {
        KeeLog.warn(
          "port already set to '" + Port.raw.name + "'. Skipping startup because it should already be underway but is taking a long time."
        );
        return;
      }
      Port.startup("page");
      store = new NonReactiveStore((mutationPayload, _excludedPort) => {
        KeeLog.debug("New page mutation/action being distributed.");
        Port.postMessage({ mutation: mutationPayload });
      });
      Port.raw.onMessage.addListener(function(m) {
        KeeLog.debug("In browser content page script, received message from background script");
        if (m.initialState) {
          store.resetTo(m.initialState);
        }
        if (m.mutation) {
          store.onRemoteMessage(Port.raw, m.mutation);
          return;
        }
        if (!connected) {
          onFirstConnect(m.frameId);
          formFilling.findMatchesInThisFrame();
          connected = true;
        } else if (m.action == Action.DetectForms) {
          if (m.resetState) {
            store.resetTo(m.resetState);
          }
          formFilling.removeKeeIconFromAllFields();
          formSaving.removeAllSubmitHandlers();
          if (store.state.entryUpdateStartedAtTimestamp >= Date.now() - 2e4) {
            formFilling.findMatchesInThisFrame({
              autofillOnSuccess: false,
              autosubmitOnSuccess: false
            });
          } else {
            formFilling.findMatchesInThisFrame();
          }
        }
        if (m.findMatchesResult) {
          formFilling.findLoginsResultHandler(m.findMatchesResult);
        }
        if (m.action == Action.ManualFill && m.selectedEntryIndex != null) {
          formFilling.closeMatchedLoginsPanel();
          formFilling.fillAndSubmit(false, null, m.selectedEntryIndex);
        }
        if (m.action == Action.ResetForms) {
          formFilling.removeKeeIconFromAllFields();
          formSaving.removeAllSubmitHandlers();
        }
        if (m.action == Action.Primary) {
          formFilling.executePrimaryAction();
        }
        if (m.action == Action.GeneratePassword) {
          passwordGenerator.createGeneratePasswordPanel();
        }
        if (m.action == Action.CloseAllPanels) {
          passwordGenerator.closeGeneratePasswordPanel();
          formFilling.closeMatchedLoginsPanel();
        }
        if (m.action == Action.ShowMatchedLoginsPanel) {
          formFilling.createMatchedLoginsPanelInCenter(m.frameId);
        }
      });
    };
    inputsObserver = new MutationObserver((mutations) => {
      if (formFilling.formFinderTimer !== null)
        return;
      if (!(store == null ? void 0 : store.state.connected) || (store == null ? void 0 : store.state.ActiveKeePassDatabaseIndex) < 0)
        return;
      let rescan = false;
      const interestingNodes = ["form", "input", "select"];
      mutations.forEach((mutation) => {
        if (rescan)
          return;
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (rescan)
              break;
            for (let i = 0; i < interestingNodes.length; i++) {
              const element = node;
              if (element.querySelector && element.querySelector(interestingNodes[i])) {
                rescan = true;
                break;
              }
            }
          }
        }
      });
      if (rescan) {
        formFilling.formFinderTimer = window.setTimeout(
          formFilling.findMatchesInThisFrame.bind(formFilling),
          500
        );
      }
    });
    window.addEventListener("pageshow", () => {
      pageShowFired = true;
      clearTimeout(missingPageShowTimer);
      if (configReady) {
        startup();
      }
    });
    window.addEventListener("pagehide", () => {
      inputsObserver.disconnect();
      if (Port.raw)
        Port.postMessage({ action: Action.PageHide });
      formFilling.removeKeeIconFromAllFields();
      Port.shutdown();
      connected = false;
      frameId = void 0;
      formUtils = void 0;
      formSaving = void 0;
      formFilling = void 0;
      passwordGenerator = void 0;
    });
    configManager.load(() => {
      configReady = true;
      if (pageShowFired) {
        startup();
      } else {
        missingPageShowTimer = window.setTimeout(startup, 1500);
      }
    });
  }
})();
