/**
 * @description 本脚本是对faker2仓库jd_plantBean.js脚本的修改
 * @description 支持多账号，暂无互助
 */
const $ = Env('京东种豆得豆');

let _log, _errEvents, _desc;
let _beans, _nutrients;
let jdPlantBeanShareArr = [];

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

async function carveUp(cookie, lastRound) {
  const eventName = '【瓜分京豆】';
  const function_id = 'receivedBean';
  if (lastRound.awardState === '6') {
    _log.push(`🟡${eventName}: ${lastRound.dateDesc}, 奖励已领取, 获得京豆: ${lastRound.awardBeans}`);
    return;
  }
  if (lastRound.awardState === '5') {
    await randomWait();
    const body = {
      roundId: lastRound.roundId,
      monitor_refer: function_id,
    };
    const reward = await request(eventName, cookie, function_id, body, 'post');
    if (reward) {
      _beans += Number(reward.data.awardBean) || 0;
      _log.push(`🟢${eventName}: ${lastRound.dateDesc},奖励领取成功, 获得京豆: ${reward.data.awardBean}`);
    }
  }
}

async function receiveNutrients(cookie, currentRound, timeNutrientsRes) {
  const eventName = '【定时收集营养液】';
  if (Number(timeNutrientsRes.nutrCount) > 0) {
    await randomWait();
    const reward = await request(
      eventName,
      cookie,
      'receiveNutrients',
      {
        roundId: currentRound.roundId,
        monitor_refer: 'plant_receiveNutrients',
      },
      'post'
    );
    if (reward) {
      _nutrients += Number(timeNutrientsRes.nutrCount) || 0;
      _log.push(`🟢${eventName}: 成功收集${timeNutrientsRes.nutrCount}瓶营养液`);
    }
  }
}

async function doTask(cookie, taskList) {
  if (taskList && taskList.length > 0) {
    for (const task of taskList.filter((task) => task.taskType === 8 || task.taskType === 92)) {
      let name = task.taskName;
      let eventName = `【做任务-${name}】`;
      _log.push(`🟡${eventName}: 需自行手动去京东APP完成`);
    }
    if (taskList.filter((task) => task.taskType !== 8 && task.taskType !== 92 && task.isFinished !== 1).length === 0) {
      _log.push(`🟢【做任务】: 全部任务已完成`);
      return;
    }
    for (let task of taskList.filter((task) => task.taskType !== 8 && task.taskType !== 92 && task.isFinished !== 1)) {
      let name = task.taskName;
      let eventName = `【做任务-${name}】`;
      if (task.dailyTimes === 1) {
        await receiveNutrientsTask(cookie, eventName, task.taskType);
        await randomWait(1500);
      }
      if (task.taskType === 3) {
        //浏览店铺
        let s = 0;
        let unFinishedShopNum = task.totalNum - task.gainedNum;
        if (unFinishedShopNum === 0) {
          continue;
        }
        const { data } = await shopTaskList(cookie);
        let goodShopListARR = [],
          moreShopListARR = [],
          shopList = [];
        if (!data.goodShopList) {
          data.goodShopList = [];
        }
        if (!data.moreShopList) {
          data.moreShopList = [];
        }
        const { goodShopList, moreShopList } = data;
        for (let i of goodShopList) {
          if (i.taskState === '2') {
            goodShopListARR.push(i);
          }
        }
        for (let j of moreShopList) {
          if (j.taskState === '2') {
            moreShopListARR.push(j);
          }
        }
        shopList = goodShopListARR.concat(moreShopListARR);
        for (let shop of shopList) {
          const { shopId, shopTaskId } = shop;
          const body = {
            monitor_refer: 'plant_shopNutrientsTask',
            shopId: shopId,
            shopTaskId: shopTaskId,
          };
          const shopRes = await request(eventName, cookie, 'shopNutrientsTask', body);
          if (shopRes && shopRes.data && shopRes.data.nutrState && shopRes.data.nutrState === '1') {
            s++;
          } else {
            _log.push(`🔴${eventName}: 异常数据 ${JSON.stringify(shopRes, null, 2)}`);
          }
          if (unFinishedShopNum === s) {
            break;
          } else {
            await randomWait(2000);
          }
        }
        let icon = '🟡';
        if (task.gainedNum + s === task.totalNum) {
          icon = '🟢';
        } else {
          _errEvents.push(`${icon}${eventName}${task.gainedNum + s}/${task.totalNum}`);
        }
        _log.push(`${icon}${eventName}: 进度 ${task.gainedNum + s}/${task.totalNum}`);
      }
      if (task.taskType === 5) {
        //挑选商品
        let s = 0;
        let unFinishedProductNum = task.totalNum - task.gainedNum;
        if (unFinishedProductNum === 0) {
          continue;
        }
        const { data } = await productTaskList(cookie);
        let productListARR = [],
          productList = [];
        const { productInfoList } = data;
        for (let i = 0; i < productInfoList.length; i++) {
          for (let j = 0; j < productInfoList[i].length; j++) {
            productListARR.push(productInfoList[i][j]);
          }
        }
        for (let i of productListARR) {
          if (i.taskState === '2') {
            productList.push(i);
          }
        }
        for (let product of productList) {
          const { skuId, productTaskId } = product;
          const body = {
            monitor_refer: 'plant_productNutrientsTask',
            productTaskId: productTaskId,
            skuId: skuId,
          };
          const productRes = await request(eventName, cookie, 'productNutrientsTask', body);
          if (productRes && productRes.data && productRes.data.nutrState && productRes.data.nutrState === '1') {
            s++;
          } else {
            _log.push(`🔴${eventName}: 异常数据 ${JSON.stringify(productRes, null, 2)}`);
          }
          if (unFinishedProductNum === s) {
            break;
          } else {
            await randomWait(2000);
          }
        }
        let icon = '🟡';
        if (task.gainedNum + s === task.totalNum) {
          icon = '🟢';
        } else {
          _errEvents.push(`${icon}${eventName}${task.gainedNum + s}/${task.totalNum}`);
        }
        _log.push(`${icon}${eventName}: 进度 ${task.gainedNum + s}/${task.totalNum}`);
      }
      if (task.taskType === 10) {
        //关注频道
        let s = 0;
        let unFinishedChannelNum = task.totalNum - task.gainedNum;
        if (unFinishedChannelNum === 0) {
          continue;
        }
        const { data } = await plantChannelTaskList(cookie);
        let goodChannelListARR = [],
          normalChannelListARR = [],
          channelList = [];
        const { goodChannelList, normalChannelList } = data;
        for (let i of goodChannelList) {
          if (i.taskState === '2') {
            goodChannelListARR.push(i);
          }
        }
        for (let j of normalChannelList) {
          if (j.taskState === '2') {
            normalChannelListARR.push(j);
          }
        }
        channelList = goodChannelListARR.concat(normalChannelListARR);
        for (let channelItem of channelList) {
          const { channelId, channelTaskId } = channelItem;
          const body = {
            channelId: channelId,
            channelTaskId: channelTaskId,
          };
          const channelRes = await request(eventName, cookie, 'plantChannelNutrientsTask', body);
          if (channelRes && channelRes.data && channelRes.data.nutrState && channelRes.data.nutrState === '1') {
            s++;
          } else {
            _log.push(`🔴${eventName}: 异常数据 ${JSON.stringify(channelRes, null, 2)}`);
          }
          if (unFinishedChannelNum === s) {
            break;
          }
        }
        let icon = '🟡';
        if (task.gainedNum + s === task.totalNum) {
          icon = '🟢';
        } else {
          _errEvents.push(`${icon}${eventName}${task.gainedNum + s}/${task.totalNum}`);
        }
        _log.push(`${icon}${eventName}: 进度 ${task.gainedNum + s}/${task.totalNum}`);
      }
    }
  }
}

async function shopTaskList(cookie) {
  const eventName = '【店铺列表】';
  return await request(eventName, cookie, 'shopTaskList', { monitor_refer: 'plant_shopList' });
}
async function productTaskList(cookie) {
  const eventName = '【商品列表】';
  return await request(eventName, cookie, 'productTaskList', { monitor_refer: 'plant_productTaskList' });
}
async function plantChannelTaskList(cookie) {
  const eventName = '【频道列表】';
  return await request(eventName, cookie, 'plantChannelTaskList');
}

async function receiveNutrientsTask(cookie, eventName, awardType) {
  const functionId = 'receiveNutrientsTask';
  const body = {
    monitor_refer: 'plant_receiveNutrientsTask',
    awardType: `${awardType}`,
  };
  let res = await request(eventName, cookie, functionId, body);
  if (res) {
    if (res.data.nutrState === '1' || res.data.status === '1') {
      _log.push(`🟢${eventName}: 任务已完成`);
      return true;
    } else {
      _log.push(`🔴${eventName}: 任务未完成\n${JSON.stringify(res, null, 2)}`);
      _errEvents.push(`🔴${eventName}`);
      return false;
    }
  }
}

async function friendList(cookie) {
  const eventName = '【好友列表】';
  const body = {
    monitor_refer: 'plantFriendList',
    monitor_source: 'plant_app_plant_index',
    pageNum: '1',
    pagesize: '1000',
  };
  return await request(eventName, cookie, 'plantFriendList', body, 'post');
}

async function collectFriendNutr(cookie, currentRound) {
  const eventName = '【帮好友收营养液】';
  const friends = await friendList(cookie);

  if (!friends) {
    return;
  }
  if (friends.data.tips) {
    _log.push(`🟡${eventName}: 今日偷取好友营养液已达上限`);
    return;
  }

  if (friends.data.friendInfoList && friends.data.friendInfoList.length > 0) {
    let nowTimes = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000);
    for (let friend of friends.data.friendInfoList) {
      let helpInfo;
      if (new Date(nowTimes).getHours() === 20) {
        if (friend.nutrCount >= 2) {
          await randomWait();
          helpInfo = await collectUserNutr(cookie, currentRound.roundId, friend.paradiseUuid);
          if (helpInfo) {
            _nutrients += Number(helpInfo.data.collectNutrRewards) || 0;
            _log.push(
              `🟢${eventName}: 帮助好友${friend.paradiseUuid}收取营养液成功, 获得${
                helpInfo.data.collectNutrRewards || 0
              }个营养液}`
            );
          }
        }
      } else {
        if (friend.nutrCount >= 3) {
          await randomWait();
          helpInfo = await collectUserNutr(cookie, currentRound.roundId, friend.paradiseUuid);
          if (helpInfo) {
            _nutrients += Number(helpInfo.data.collectNutrRewards) || 0;
            _log.push(
              `🟢${eventName}: 帮助好友${friend.paradiseUuid}收取营养液成功, 获得${
                helpInfo.data.collectNutrRewards || 0
              }个营养液}`
            );
          }
        }
      }
    }
  }
}

async function collectUserNutr(cookie, roundId, paradiseUuid) {
  const eventName = '【收好友营养液】';
  let functionId = 'collectUserNutr';
  const body = {
    roundId: roundId,
    paradiseUuid: paradiseUuid,
    monitor_refer: 'collectUserNutr',
    monitor_source: 'plant_app_plant_index',
  };
  return await request(eventName, cookie, functionId, body, 'post');
}

async function cultureBean(cookie, currentRound) {
  let name;
  let eventName = `【收任务营养液-${name}】`;
  if (currentRound && currentRound.bubbleInfos && currentRound.bubbleInfos.length > 0) {
    for (let bubbleInfo of currentRound.bubbleInfos) {
      await randomWait();
      name = bubbleInfo.name;
      let body = {
        roundId: currentRound.roundId,
        nutrientsType: bubbleInfo.nutrientsType,
        monitor_refer: 'plant_receiveNutrients',
      };
      if (await request(eventName, cookie, 'cultureBean', body, 'post')) {
        _nutrients += Number(bubbleInfo.nutrNum) || 0;
        _log.push(`🟢${eventName}: 获得${bubbleInfo.nutrNum || 0}个营养液`);
      }
    }
  }
}

async function main(cookieObj) {
  _beans = _nutrients = 0;
  _log = [`\n++++++++++⭐${cookieObj.nickname}⭐++++++++++\n`];
  _errEvents = ['\n++++++++++🔻事件提醒🔻++++++++++\n'];
  _desc = [];

  let indexInfo = await plantBeanIndex(cookieObj.cookie);
  if (indexInfo) {
    // const shareUrl = $.plantBeanIndexResult.data.jwordShareInfo.shareUrl;
    // $.myPlantUuid = getParam(shareUrl, 'plantUuid');
    // console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${$.myPlantUuid}\n`);

    const lastRound = indexInfo.data.roundList.filter((item) => item.roundState === '1')[0]; //上期的roundId
    let currentRound = indexInfo.data.roundList.filter((item) => item.roundState === '2')[0]; //本期的roundId
    const taskList = indexInfo.data.taskList;
    await carveUp(cookieObj.cookie, lastRound);

    await receiveNutrients(cookieObj.cookie, currentRound, indexInfo.data.timeNutrientsRes); //定时领取营养液

    await randomWait();
    await collectFriendNutr(cookieObj.cookie, currentRound);

    await randomWait();
    await doTask(cookieObj.cookie, taskList); //做日常任务

    await randomWait();
    indexInfo = await plantBeanIndex(cookieObj.cookie);
    if (indexInfo) {
      currentRound = indexInfo.data.roundList.filter((item) => item.roundState === '2')[0]; //本期的roundId
      await randomWait(2000);
      await cultureBean(cookieObj.cookie, currentRound);
    }

    if (_beans === 0) {
      $.subt = `${cookieObj.nickname}, 营养液: +${_nutrients}瓶 ~`;
    } else {
      $.subt = `${cookieObj.nickname}, 瓜分京豆: +${_beans}, 营养液: +${_nutrients}瓶 ~`;
    }
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
        $.subt = `${cookieObj.nickname}`;
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
    url: `https://api.m.jd.com/client.action?functionId=${function_id}&body=${encodeURIComponent(
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
