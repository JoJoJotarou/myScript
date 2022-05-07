/**
 * @description 支持多账号，种豆得豆内部互助, 支持获取/更新互助码
 */
const $ = Env('京东种豆得豆互助');

let _log, _errEvents, _desc;
let jdPlantBeanShareArr = [];
let successHelp = 0;

async function plantBeanIndex(cookie) {
  const eventName = '【种豆得豆首页】';
  return await request(eventName, cookie, 'plantBeanIndex', {}, 'post');
  //   let retryTimes = 3;

  //   for (let i = 0; i < retryTimes; i++) {
  //     await randomWait(i * 10 * 1000);
  //     const indexInfo = await request(eventName, cookie, 'plantBeanIndex', {}, 'post');
  //     if (indexInfo) {
  //       return indexInfo;
  //     } else {
  //       _log.push(`🔴${eventName}: 第${i + 1}次获取首页信息失败\n ${JSON.stringify(indexInfo, null, 2)}`);
  //     }
  //   }
  //   _errEvents.push(`🔴${eventName}`);
}

async function doHelp(cookie) {
  const eventName = '【内部好友互助】';
  let runTimes = 0;

  for (let plantUuid of jdPlantBeanShareArr) {
    if (!plantUuid) continue;
    runTimes++;
    let helpRes = await helpShare(cookie, plantUuid);
    if (runTimes == 5) {
      _log.push(`🟡${eventName}: 访问接口次数达到5次，休息半分钟.....`);
      await randomWait(30 * 1000);
      runTimes = 0;
    } else {
      await randomWait(3000);
    }
    if (helpRes) {
      if (helpRes.data.helpShareRes) {
        if (helpRes.data.helpShareRes.state === '1') {
          _log.push(`🟢${eventName}: 助力好友${plantUuid}成功, ${helpRes.data.helpShareRes.promptText}`);
          successHelp++;
        } else if (helpRes.data.helpShareRes.state === '2') {
          _log.push(`🟡${eventName}: 您今日助力的机会已耗尽，已不能再帮助好友助力了`);
          break;
        } else if (helpRes.data.helpShareRes.state === '3') {
          _log.push(`🟡${eventName}: 该好友今日已满9人助力/20瓶营养液,明天再来为Ta助力吧`);
        } else if (helpRes.data.helpShareRes.state === '4') {
          _log.push(`🟡${eventName}: ${helpRes.data.helpShareRes.promptText}`);
        } else {
          _log.push(`🔴${eventName}: 未知数据, 助力好友${plantUuid}失败, ${JSON.stringify(helpRes, null, 2)}`);
          _errEvents.push(`🔴${eventName}`);
        }
      }
    }
  }
}

async function helpShare(cookie, plantUuid) {
  const eventName = `【助力好友】`;
  const body = {
    plantUuid: plantUuid,
    wxHeadImgUrl: '',
    shareUuid: '',
    followType: '1',
  };
  return await request(eventName, cookie, `plantBeanIndex`, body, 'post');
}

function getParam(url, name) {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  const r = url.match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

function myShareCode(shareUrl, cookieObj) {
  const eventName = '【我的互助码】';
  let myPlantUuid = getParam(shareUrl, 'plantUuid');

  if (myPlantUuid.length === 0) {
    _desc.push(`🟡${eventName}: 暂无互助码`);
    return;
  }

  if (!cookieObj.shareCode || !cookieObj.shareCode.plantBean) {
    cookieObj['shareCode']['plantBean'] = myPlantUuid;
    _log.push(`🟢${eventName}: 获取到互助码: ${myPlantUuid}`);
    $.setdata(JSON.stringify(cookieObjs), 'GLOBAL_JD_COOKIES');
    _desc.push(`成功获取互助码`);
  } else if (cookieObj.shareCode && cookieObj.shareCode.plantBean && cookieObj.shareCode.plantBean !== myPlantUuid) {
    cookieObj['shareCode']['plantBean'] = myPlantUuid;
    _log.push(`🟢${eventName}: 更新互助码: ${myPlantUuid}`);
    $.setdata(JSON.stringify(cookieObjs), 'GLOBAL_JD_COOKIES');
    _desc.push(`成功互助码更新`);
  }
}

async function main(cookieObj) {
  _nutrients = 0;
  _log = [`\n++++++++++⭐${cookieObj.nickname}⭐++++++++++\n`];
  _errEvents = ['\n++++++++++🔻事件提醒🔻++++++++++\n'];
  _desc = [];

  let indexInfo = await plantBeanIndex(cookieObj.cookie);
  if (indexInfo) {
    const shareUrl = indexInfo.data.jwordShareInfo.shareUrl;
    myShareCode(shareUrl, cookieObj);

    if (jdPlantBeanShareArr.length > 0) {
      await randomWait();
      await doHelp(cookieObj.cookie);
      _desc.push(`成功助力${successHelp}个好友 ~`);
    } else {
      _desc.push(`暂无需要助力的好友`);
    }
  }
}

function getShareCodes(currentUserId) {
  const eventName = '【获取互助码】';
  jdPlantBeanShareArr = [];
  cookieObjs.forEach((item) => {
    if (item.userId !== currentUserId && item.shareCode && item.shareCode.plantBean) {
      jdPlantBeanShareArr.push(item.name);
    }
  });
  _log.push(`${eventName}: 获取到${jdPlantBeanShareArr.length}个好友的互助码`);
}

let cookieObjs = $.getdata('GLOBAL_JD_COOKIES');

!(async () => {
  const specifyUserId = $.getdata('GLOBAL_SPECIFY_USER_ID');

  if (cookieObjs && JSON.parse(cookieObjs).length > 0) {
    cookieObjs = JSON.parse(cookieObjs);
    if (specifyUserId && specifyUserId.indexOf('jd_') !== -1) {
      // 实现一次执行一个账号
      cookieObjs = cookieObjs.filter((cookie) => cookie.userId === specifyUserId);
    }
    let i = 1;
    for (let cookieObj of cookieObjs) {
      try {
        $.subt = `${cookieObj.nickname}`;
        getShareCodes(cookieObjs, cookieObj.userId);
        await main(cookieObj);
      } catch (error) {
        _log.push(`🔴 ${error}`);
        _desc.push(`🔴 ${error}`);
      } finally {
        $.log(..._log);
        $.log(..._errEvents);
        if (_errEvents.length > 1) {
          _desc.push(`❗ 查看日志了解详情>>`);
        } else {
          _desc.push(`🆗 查看日志了解详情>>`);
        }
        $.desc = _desc.join('\n');
        $.msg($.name, $.subt || '', $.desc);
      }

      // 切换账号等待至少5秒
      if (i < cookieObjs.length) {
        await randomWait(5000);
      }
      i++;
    }
  } else {
    throw '请先获取会话';
  }
})()
  .catch((e) => {
    $.subt = '脚本执行异常';
    $.msg($.name, $.subt, `🔴 ${String(e)}`);
    $.logErr(e);
  })
  .finally(() => {
    $.done();
  });

function request(eventName, cookie, function_id, body = {}, method = 'get') {
  let _body = {
    version: '9.2.4.1',
    monitor_source: 'plant_m_plant_index',
    monitor_refer: '',
  };
  let option = {
    url: 'https://api.m.jd.com/client.action',
    body: `functionId=${function_id}&body=${encodeURIComponent(
      JSON.stringify(Object.assign(_body, body))
    )}&appid=ld&client=apple&clientVersion=10.5.2&networkType=wifi&osVersion=14.6`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Accept: '*/*',
      Connection: 'keep-alive',
      'User-Agent': userAgent('jd'),
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer:
        'https://plantearth.m.jd.com/plantBean/index?source=wojinghd&sid=06eb567bdb0c9abecb298ab48172115w&un_area=2_2830_51811_0',
      'request-from': 'native',
    },
    timeout: 10000,
  };
  if (method === 'post') {
    option.url = 'https://api.m.jd.com/client.action';
    option.body = `functionId=${function_id}&body=${encodeURIComponent(
      JSON.stringify(Object.assign(_body, body))
    )}&appid=ld&client=apple&clientVersion=10.5.2&networkType=wifi&osVersion=14.6`;
  } else {
    option.url = `https://api.m.jd.com/client.action?functionId=${function_id}&body=${encodeURIComponent(
      JSON.stringify(Object.assign(_body, body))
    )}&appid=ld&client=apple&clientVersion=10.5.2&networkType=wifi&osVersion=14.6`;
  }
  return new Promise((resolve, reject) => {
    if (method === 'post') {
      $.post(option, (err, resp, data) => {
        try {
          if (resp.statusCode === 200 && JSON.parse(data) && JSON.parse(data).code === '0') {
            _log.push(`🟢${eventName}: 请求成功`);
            resolve(JSON.parse(data));
          } else {
            throw err || data;
          }
        } catch (error) {
          error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
          _errEvents.push(`🔴${eventName}`);
          resolve();
        }
      });
    } else {
      $.get(option, (err, resp, data) => {
        try {
          if (resp.statusCode === 200 && JSON.parse(data) && JSON.parse(data).code === '0') {
            _log.push(`🟢${eventName}: 请求成功`);
            resolve(JSON.parse(data));
          } else {
            throw err || data;
          }
        } catch (error) {
          error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
          _errEvents.push(`🔴${eventName}`);
          resolve();
        }
      });
    }
  });
}

function userAgent(app) {
  // 获取不同app的user-agent
  return {
    jd: 'jdapp;iPhone;10.5.2;;;M/5.0;JDEbook/openapp.jdreader;appBuild/168069;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22CQZwZtO3CzGzYtC0DtG1YJG1DJGmY2HuYWHsDzdrENVwDJGyZNvwEK%3D%3D%22%2C%22sv%22%3A%22CJGkDq%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1651124892%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
    jx: 'jdpingou;iPhone;5.25.0;appBuild/100934;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/0;hasOCPay/0;supportBestPay/0;session/4;pap/JA2019_3111789;supportJDSHWK/1;ef/1;ep/%7B%22ciphertype%22:5,%22cipher%22:%7B%22ud%22:%22ENO0ZNunDtc0CwPtCtHwZQPtDtU2DWUnYtO0Dzu5DwDsZWGyYzTsZq==%22,%22bd%22:%22YXLmbQU=%22,%22iad%22:%22%22,%22sv%22:%22CJGkDq==%22%7D,%22ts%22:1651399595,%22hdid%22:%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw=%22,%22version%22:%221.0.3%22,%22appname%22:%22com.360buy.jdpingou%22,%22ridx%22:-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    safari:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  }[app];
}

// prettier-ignore
function ts(){return new Date().getTime()}
// prettier-ignore
function randomWait(min) { randomTime = ((Math.random() / 5) * 10000 + (min || 1000)).toFixed(0); _log.push(`⏳休息${randomTime}ms`); return new Promise((resolve) => setTimeout(resolve, randomTime)) }
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: i, statusCode: r, headers: o, rawBody: h }, s.decode(h, this.encoding)) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: s, statusCode: r, headers: o, rawBody: h }, i.decode(h, this.encoding)) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
