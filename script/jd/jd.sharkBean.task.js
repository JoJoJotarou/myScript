/**
 * @ZhouStarStar9527
 * @name 京东新版摇京豆 2021/03/02~2023/12/31
 * @description 支持多账号, 执行一个账号大约需要30s~60s
 * @description 入口：京东首页→领京豆→点击页面中的【摇京豆】”，进入摇京豆游戏页面参与活动。
 */

const $ = Env('京东新版摇京豆');
let _log, _beans, _desc, indexPageInfoList;

function getOption(cookie, appid, functionId, body) {
  let option = {
    url: `https://api.m.jd.com/?t=${ts()}&appid=${appid}&functionId=${functionId}&body=${encodeURIComponent(
      JSON.stringify(body)
    )}`,
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      Host: 'api.m.jd.com',
      Cookie: cookie,
      Origin: 'https://spa.jd.com',
      Referer: 'https://spa.jd.com/home',
      'User-Agent':
        'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
  return option;
}

function indexPage(cookie) {
  const eventName = '【获取摇京豆首页】';
  const body = { paramData: { token: 'dd2fb032-9fa3-493b-8cd0-0d57cd51812d' } };
  option = getOption(cookie, 'sharkBean', 'pg_channel_page_data', body);

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        const _data = JSON.parse(data).data;
        if (resp.statusCode === 200 && _data) {
          indexPageInfoList = _data.floorInfoList;
          _log.push(`🟢${eventName}`);
        } else {
          throw err || data;
        }
      } catch (e) {
        _log.push(`🔴${eventName}: ${err}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

async function checkIn(cookie) {
  const eventName = '【签到】';
  try {
    if (!indexPageInfoList) {
      throw '未获取到首页信息';
    }
    const signInfo = indexPageInfoList.filter((item) => !!item && item.code === 'SIGN_ACT_INFO')[0];
    const singToken = signInfo.token;
    // 当前签到次数
    const currSignCursor = signInfo.floorData.signActInfo.currSignCursor;
    // 签到累积奖励信息
    const cursorBeanNum = signInfo.floorData.signActInfo.cursorBeanNum;
    const signStatus = signInfo.floorData.signActInfo.signActCycles.filter(
      (item) => !!item && item.signCursor === currSignCursor
    )[0].signStatus;

    if (signStatus === -1) {
      // 未签到
      await _checkIn(cookie, singToken, currSignCursor, cursorBeanNum);
    } else {
      _log.push(`🟡${eventName}: 本轮第${currSignCursor}次签到已完成`);
    }
  } catch (error) {
    _log.push(`🔴${eventName}: ${error}`);
    _desc.push(`🔴${eventName}`);
  }
}

function _checkIn(cookie, singToken, currSignCursor, cursorBeanNum) {
  const eventName = '【签到】';
  const body = { floorToken: singToken, dataSourceCode: 'signIn', argMap: { currSignCursor: currSignCursor } };
  const option = getOption(cookie, 'sharkBean', 'pg_interact_interface_invoke', body);

  return new Promise((resolve, reject) => {
    $.post(option, (err, resp, data) => {
      try {
        const _data = JSON.parse(data).data;
        if (resp.statusCode === 200 && _data) {
          const bean =
            _data.rewardVos[0].jingBeanVo.beanNum +
            (cursorBeanNum && cursorBeanNum[currSignCursor] ? Number(cursorBeanNum[currSignCursor]) : 0);
          _beans += bean;
          _log.push(`🟢${eventName}: 本轮第${currSignCursor}次签到成功, 获得${bean}个京豆`);
          _desc.push(`🟢${eventName}`);
        } else {
          throw err || data;
        }
      } catch (error) {
        _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

async function doneTasks(cookie) {
  let i = 1;
  const tasks = await getTasks(cookie);
  for (const task of tasks) {
    await browse(cookie, task.id, task.title);
    if (i !== tasks.length) {
      await randomWait();
    }
    i++;
  }
}

function getTasks(cookie) {
  const eventName = '【任务列表】';
  const option = getOption(cookie, 'vip_h5', 'vvipclub_lotteryTask', { info: 'browseTask', withItem: true });

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).success) {
          const tasks = JSON.parse(data).data[0].taskItems.filter((task) => task.finish !== true);
          if (tasks.length > 0) {
            _log.push(`🟢${eventName}: 当前共有${tasks.length}个任务未完成`);
          } else {
            _log.push(`🟡${eventName}: 所有任务已完成`);
          }
          resolve(tasks);
        } else {
          throw err || data;
        }
      } catch (error) {
        _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
        resolve([]);
      }
    });
  });
}

function browse(cookie, taskId, taskName) {
  let eventName = `【浏览-${taskName}】`;
  let body = { taskName: 'browseTask', taskItemId: taskId };
  const option = getOption(cookie, 'vip_h5', 'vvipclub_doTask', body);

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).success && JSON.parse(data).data.isFinish) {
          _log.push(`🟢${eventName}: 浏览完成`);
        } else {
          throw err || data;
        }
      } catch (error) {
        _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

async function shake(cookie) {
  const eventName = '【摇奖】';
  try {
    if (!indexPageInfoList) {
      throw '未获取到首页信息';
    }
    const shakingInfo = indexPageInfoList.filter((item) => !!item && item.code === 'SHAKING_BOX_INFO')[0];
    // 获取摇奖次数
    let remainLotteryTimes = shakingInfo.floorData.shakingBoxInfo.remainLotteryTimes;

    if (remainLotteryTimes === 0) {
      _log.push(`🟡${eventName}: 摇奖次数已用完`);
      return;
    }

    for (let index = 0; index < remainLotteryTimes; index++) {
      await _shake(cookie);
      if (index < remainLotteryTimes) {
        await randomWait();
      }
    }
    _desc.push(`🟢${eventName}`);
  } catch (error) {
    _log.push(`🔴${eventName}: ${error}`);
    _desc.push(`🔴${eventName}`);
  }
}

function _shake(cookie) {
  const eventName = '【摇奖】';
  let option = getOption(cookie, 'sharkBean', 'vvipclub_shaking_lottery', {});
  option.url +=
    '&h5st=20220428170255435%3B7810563172488273%3Bae692%3Btk02wee691d8118nws6sRJuqo6QXnqpgjgHklwsMZEIqKjb1gKlkx%2F4JX5OP%2F0kwGEhmbdOiuOYY3YycmRIAjHvyjg5H%3B830d177a7f231a848ee9a58f182b455c77e2a256785af07466b46b797eb34c5b%3B3.0%3B1651136575435';

  return new Promise((resolve, reject) => {
    $.post(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).success) {
          // 获取摇奖结果（当前未摇到京东，等摇到再改）
          // const couponInfo = JSON.parse(data).data.couponInfo;
          // if (couponInfo.couponType === 1) {
          //   _log.push(`🟢${eventName}: 获得优惠券: 满${couponQuota}减${couponDiscount}, ${limitStr}, ${endTime}失效`);
          // } else {
          //   _log.push(`🟢${eventName}: ${couponInfo}`);
          // }
          _log.push(`🟢${eventName}: ${data}`);
        } else {
          throw err | data;
        }
      } catch (error) {
        _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

function getTotalBeans(cookie) {
  const eventName = '【京豆统计】';
  const option = {
    url: 'https://wq.jd.com/user/info/QueryJDUserInfo?g_login_type=1&sceneval=2',
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Host: 'wq.jd.com',
      Cookie: cookie,
      Referer: 'https://wqs.jd.com/',
      'User-Agent':
        'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        const _data = JSON.parse(data).base;
        if (resp.statusCode === 200 && _data) {
          const nickname = _data.nickname;
          const totalBeans = _data.jdNum;
          _log.push(`🟢${eventName}: ${nickname}当前有${totalBeans}个京豆`);
          resolve([nickname, totalBeans]);
        } else {
          throw err || data;
        }
      } catch (error) {
        _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
        resolve();
      }
    });
  });
}

!(async () => {
  const GLOBAL_JD_COOKIE = $.getdata('GLOBAL_JD_COOKIE');

  if (GLOBAL_JD_COOKIE && JSON.parse(GLOBAL_JD_COOKIE).length > 0) {
    let i = 1;
    for (const COOKIE of JSON.parse(GLOBAL_JD_COOKIE)) {
      try {
        _beans = 0;
        _log = [`\n++++++++++${COOKIE.userId}++++++++++\n`];
        _desc = [];

        // 如果签到放在首位执行，会导致摇奖时获取不到摇奖次数
        // 故这里先做任务，在获取一次首页信息完成签到和摇奖
        await doneTasks(COOKIE.cookie);
        await indexPage(COOKIE.cookie);
        await checkIn(COOKIE.cookie);
        await shake(COOKIE.cookie);
        const [nickname, totalBeans] = await getTotalBeans(COOKIE.cookie);
        $.subt = `${nickname}, 京豆: ${totalBeans}(+${_beans})`;
      } catch (error) {
        _log.push(`🔴${error}`);
        _desc.push(`🔴${COOKIE.userId}`);
      } finally {
        $.log(..._log);
        $.desc = _desc.join('');
        $.msg($.name, $.subt || '', $.desc);
      }

      // 切换账号等待至少5秒
      if (i < JSON.parse(GLOBAL_JD_COOKIE).length) {
        await randomWait(5000);
      }
      i++;
    }
  } else {
    throw '请先获取会话';
  }
})()
  .catch((e) => {
    $.subt = '🔴 脚本执行异常';
    $.msg($.name, $.subt, e);
    $.logErr(e);
  })
  .finally(() => {
    $.done();
  });

function ts() {
  // 获取时间戳
  return new Date().getTime();
}

// prettier-ignore
function randomWait(min) { randomTime = ((Math.random() / 5) * 10000 + (min || 1000)).toFixed(0); _log.push(`⏳休息${randomTime}ms`); return new Promise((resolve) => setTimeout(resolve, randomTime)) }
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: i, statusCode: r, headers: o, rawBody: h }, s.decode(h, this.encoding)) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: s, statusCode: r, headers: o, rawBody: h }, i.decode(h, this.encoding)) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
