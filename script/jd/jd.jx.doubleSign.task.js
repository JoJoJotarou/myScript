/**
 * @ZhouStarStar9527
 * @description 支持多账号
 * @description 入口：京东APP -> 首页 -> 领京豆 -> 京喜双签
 * @description 目前该脚本仅会完成京喜财富岛任务(特指“财富岛->赚财富”中的任务)中的签到任务，其他任务是支持完成，但是这里不会调用完成
 */
const $ = Env('京喜双签');

let _log, _desc;
let _beans, _cash, _jxCoins;

function jdSignIn(cookie) {
  const eventName = '【京东签到】';
  const option = getOption('https://api.m.jd.com/client.action?functionId=signBeanAct&appid=ld', {
    Cookie: cookie,
    Referer: 'https://wqs.jd.com/',
  });

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        _data = JSON.parse(data).data;
        if (resp.statusCode === 200 && _data) {
          if (_data.status === '1') {
            _beans += Number(_data.dailyAward.beanAward.beanCount) || 0;
            _log.push(`🟢${eventName}: 获得${_data.dailyAward.beanAward.beanCount}个京豆`);
            _desc.push(`🟢${eventName}`);
          } else if (_data.status === '2') {
            _log.push(`🟡${eventName}: 今天已签到`);
          }
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

function jxCfdTaskList(cookie) {
  /**
   * Data.TaskList.dwCompleteNum = Data.TaskList.dwTargetNum:表示任务已完成
   * Data.TaskList.dwAwardStatus = 1:表示任务完成并领取奖励
   * Data.TaskList.dwCompleteNum = Data.TaskList.dwTargetNum & Data.TaskList.dwAwardStatus = 2:表示任务完成可领奖
   */
  const eventName = '【京喜财富岛任务列表】';
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/GetActTask?strZone=jxbfd&source=jxbfd&dwEnv=7&ptag=7155.9.47&_ste=1&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198&bizCode=jxbfd&_cfd_t=${ts()}&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone&h5st=${geth5st()}&_=${ts()}`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).iRet === 0) {
          const taskList = JSON.parse(data).Data.TaskList;
          let unfinishedTasks = taskList.filter((task) => task.dwAwardStatus === 2) || [];
          let finishedTasks = taskList.filter((task) => task.dwAwardStatus === 1) || [];
          _log.push(
            `🟢${eventName}: 总任务数: ${taskList.length}, 未完成任务数: ${unfinishedTasks.length}, 已完成任务数: ${finishedTasks.length}`
          );
          resolve(taskList);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
        resolve([]);
      }
    });
  });
}

function jxCfdDoTask(cookie, task) {
  let eventName = `【京喜财富岛做任务-${task.strTaskName}】`;
  const option = getOption(
    `https://m.jingxi.com/newtasksys/newtasksys_front/DoTask?strZone=jxbfd&bizCode=jxbfddch&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=7155.9.47&taskId=${
      task.ddwTaskId
    }&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone%2CtaskId&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).ret === 0) {
          _log.push(`🟢${eventName}: 成功完成任务`);
          _desc.push(`🟢${eventName}`);
          resolve(true);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
        resolve(false);
      }
    });
  });
}

function jxCfdGetTaskReward(cookie, task) {
  let eventName = `【京喜财富岛领任务奖励-${task.strTaskName}】`;
  const option = getOption(
    `https://m.jingxi.com/newtasksys/newtasksys_front/Award?strZone=jxbfd&bizCode=jxbfddch&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=138631.77.28&taskId=${
      task.ddwTaskId
    }&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone%2CtaskId&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).ret === 0 && task.ddwTaskId === 3108) {
          // “签到抽红包”任务特殊处理
          let prize = JSON.parse(JSON.parse(data).data.prizeInfo).strPrizeName;
          _cash += Number(prize.match(/([\d\.]+)/)[1]);
          _log.push(`🟢${eventName}: 获得${prize}现金红包奖励`);
          _desc.push(`🟢${eventName}`);
        } else if (resp.statusCode === 200 && JSON.parse(data).ret === 0) {
          let coin = JSON.parse(JSON.parse(data).data.prizeInfo).ddwCoin / 10000;
          _jxCoins += coin;
          _log.push(`🟢${eventName}: 获得${coin}万个京币奖励`);
          _desc.push(`🟢${eventName}`);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

function jdJxDoubleSignReward(cookie) {
  const eventName = '【京喜双签领奖】';
  const option = getOption(
    `https://wq.jd.com/jxjdsignin/IssueReward?_t=${ts()}&h5st=${geth5st()}&_stk=_t&sceneval=2&g_login_type=1&g_ty=ajax&appCode=msc588d6d5`,
    {
      Cookie: cookie,
      Referer: 'https://wqs.jd.com/pingou/double_signin_bean/index.html',
      Origin: 'https://wqs.jd.com',
      Accept: 'application/json',
    }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (
          resp.statusCode === 200 &&
          JSON.parse(data).retCode === 0 &&
          JSON.parse(data).data.double_sign_status === 0
        ) {
          _beans += JSON.parse(data).data.jx_award;
          _log.push(`🟢${eventName}: 获得${JSON.parse(data).data.jx_award}个京豆`);
          _desc.push(`🟢${eventName}`);
        } else if (
          resp.statusCode === 200 &&
          JSON.parse(data).retCode === 0 &&
          JSON.parse(data).data.double_sign_status === 1
        ) {
          _log.push(`🟡${eventName}: 今天已领取`);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
      } finally {
        resolve();
      }
    });
  });
}

function jdJxDoubleSignInfo(cookie) {
  const eventName = '【京喜双签状态】';
  const option = getOption(
    `https://wq.jd.com/jxjdsignin/SignedInfo?_t=${ts()}&h5st=${geth5st()}&_stk=_t&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ajax&appCode=msc588d6d5`,
    {
      Cookie: cookie,
      Referer: 'https://wqs.jd.com/pingou/double_signin_bean/index.html',
      Origin: 'https://wqs.jd.com',
      Accept: 'application/json',
    }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).retCode === 0 && JSON.parse(data).data) {
          _log.push(
            `🟢${eventName}: ${JSON.parse(data).data.jd_sign_status === 1 ? '✓ 京东签到完成' : '⨉ 京东签到未完成'} ${
              JSON.parse(data).data.jx_sign_status === 1 ? '✓ 京喜签到完成' : '⨉ 京喜签到未完成'
            } ${JSON.parse(data).data.double_sign_status === 1 ? '✓ 双签礼包已领' : '⨉ 双签礼包未领'} `
          );
          resolve(JSON.parse(data).data);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        _desc.push(`🔴${eventName}`);
        resolve();
      }
    });
  });
}

function geth5st() {
  const timestamp = ts();
  return encodeURIComponent(
    [
      $.time('yyyyMMddHHmmssS'),
      '8302800516333237',
      '0f6ed',
      'tk02w38741f1918nVipfh3wPzyiXfhrzKXjjwRqhjqfkn4YdXllfxWcPejtr8ySYdqBmgyPq3YmC0zn95n2XZgfpGUlX',
      'd03a669606215327a47d83cf63ea68bbf4ca5c5c9edac81f7ebd46814d9c3111',
      '3.0',
      String(timestamp),
    ].join(';')
  );
}

async function main(cookieObj) {
  _beans = _cash = _jxCoins = 0;
  _log = [`\n++++++++++${cookieObj.nickname}++++++++++\n`];
  _desc = [];

  let doubleSignInfo = await jdJxDoubleSignInfo(cookieObj.cookie);
  if (doubleSignInfo) {
    if (doubleSignInfo.double_sign_status !== 1) {
      if (
        doubleSignInfo.jd_sign_status === 1 &&
        doubleSignInfo.jx_sign_status === 1 &&
        doubleSignInfo.double_sign_status !== 1
      ) {
        await jdJxDoubleSignReward(cookieObj.cookie);
        await randomWait();
      } else {
        if (doubleSignInfo.jd_sign_status !== 1) {
          await jdSignIn(cookieObj.cookie);
          await randomWait();
        }
        if (doubleSignInfo.jx_sign_status !== 1) {
          // 仅完成签到任务
          const taskList = await jxCfdTaskList(cookieObj.cookie);
          const signTask = taskList.filter((task) => task.ddwTaskId === 3108)[0];
          if (!signTask) {
            throw `无法找到签到领红包任务(taskId=3108), 请检查任务列表是否正常:\n${taskList}`;
          }
          const res = await jxCfdDoTask(cookieObj.cookie, signTask);
          if (res) {
            await jxCfdGetTaskReward(cookieObj.cookie, signTask);
          }
          await randomWait();
        }
        await jdJxDoubleSignReward(cookieObj.cookie);
        await randomWait();
      }

      const [nickname, totalBeans] = await getUserInfo(cookieObj.cookie);
      $.subt = `${nickname}, 京豆: ${totalBeans}(+${_beans})，红包: +${_cash}`;
    } else {
      $.subt = `${cookieObj.nickname}，今日已完成 ~`;
    }
  } else {
    throw '获取京喜双签信息失败';
  }
}

!(async () => {
  let cookieObjs = $.getdata('GLOBAL_JD_COOKIES');
  const specifyUserId = $.getdata('GLOBAL_SPECIFY_USER_ID');

  if (cookieObjs && JSON.parse(cookieObjs).length > 0) {
    cookieObjs = JSON.parse(cookieObjs);
    if (specifyUserId && specifyUserId.indexOf('jd_') !== -1) {
      // 实现一次执行一个账号
      cookieObjs = cookieObjs.filter((cookie) => cookie.userId === specifyUserId);
    }
    let i = 1;
    for (const cookieObj of cookieObjs) {
      try {
        await main(cookieObj);
      } catch (error) {
        _log.push(`🔴 ${error}`);
        _desc.push(`🔴 ${error}`);
        $.subt = `${cookieObj.nickname}`;
      } finally {
        $.log(..._log);
        $.desc = _desc.join('');
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

function getOption(url, headers, body = '') {
  // 默认的option
  let _headers = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    Host: url.match(/\/\/([\w\.]*)/)[1],
    'User-Agent': userAgent('jd'),
  };

  return {
    url: url + (body ? `&body=${encodeURIComponent(JSON.stringify(body))}` : ''),
    headers: Object.assign({}, _headers, headers),
  };
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
function getUserInfo(cookie){const eventName='【用户信息】';const option={url:'https://wq.jd.com/user/info/QueryJDUserInfo?g_login_type=1&sceneval=2',headers:{Accept:'*/*','Accept-Encoding':'gzip, deflate, br','Accept-Language':'zh-cn',Host:'wq.jd.com',Cookie:cookie,Connection:'keep-alive',Referer:'https://wqs.jd.com/','User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',},};return new Promise((resolve,reject)=>{$.get(option,(err,resp,data)=>{try{if(resp.statusCode===200&&JSON.parse(data).retcode===0&&JSON.parse(data).base){const nickname=JSON.parse(data).base.nickname;const totalBeans=JSON.parse(data).base.jdNum;_log.push(`🟢${eventName}:${nickname}当前有${totalBeans}个京豆`);resolve([nickname,totalBeans])}else{throw err||data;}}catch(error){error!==data?_log.push(`🔴${eventName}:${error}\n${data}`):_log.push(`🔴${eventName}:${error}`);_desc.push(`🔴${eventName}`);resolve([])}})})}
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: i, statusCode: r, headers: o, rawBody: h }, s.decode(h, this.encoding)) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: s, statusCode: r, headers: o, rawBody: h }, i.decode(h, this.encoding)) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
