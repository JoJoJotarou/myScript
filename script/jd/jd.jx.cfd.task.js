/**
 * @ZhouStarStar9527
 * @description 支持多账号
 * @description 入口：京喜APP -> 首页 -> 财富小岛
 * @date 2022-05
 *
 * ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
 *             Support Info
 * ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
 *
 * 🚨务必通过重写脚本获取一次PhoneID, 否则一些任务无法执行，使用请查看https://raw.githubusercontent.com/JoJoJotarou/myScript/master/script/jd/rewrite/jdjx.cfd.sign.conf
 *
 * ✅ 赚京币 - 成就赚财富 - 捡20贝壳
 * ✅ 赚财富
 * ✅ 赚京币 - 成就赚财富 - 领成就奖励
 * ❌ 赚京币 - 任务赚京币 - 经营赚京币
 * ✅ 赚京币 - 任务赚京币 - 连续营业赢红包(京喜App&微信小程序双签)（是否需要PhoneID: √）
 * ❌ 故事任务
 */
const $ = Env('京喜财富小岛');

let _log, _desc;
let _cash, _jxCoins, _rich;

function jxCfdZjbTaskList(cookie) {
  // 赚京币任务列表(成就赚财富任务9个，经营赚京币11个)
  const eventName = '【赚京币-任务列表】';
  const option = getOption(
    `https://m.jingxi.com/newtasksys/newtasksys_front/GetUserTaskStatusList?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=138631.77.28&taskId=0&showAreaTaskFlag=0&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2CshowAreaTaskFlag%2Csource%2CstrZone%2CtaskId&_ste=1&h5st${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).ret === 0 && JSON.parse(data).data) {
          const taskList = JSON.parse(data).data.userTaskStatusList;
          let unfinishedTasks = taskList.filter((task) => task.awardStatus === 2) || [];
          let finishedTasks = taskList.filter((task) => task.awardStatus === 1) || [];
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

// ************************
// ***任务赚京币相关函数***
// ************************
async function jxCfdZjbCompleteTask(cookie) {
  _log.push('🟡【赚京币】: 当前模块暂未开发');
}

// *************************
// ***任务赚京币-连续营业***
// *************************
async function jxCfdZjbSignIn(cookie, jxPhoneId) {
  // dwEnv = 7 表示京喜app dwEnv = 6表示微信小程序
  const eventName = '【赚京币-双签】';
  let res = false;
  // 京喜App签到
  let jxSignInfo = await jxCfdZjbAppOrWxSignPage(cookie);
  let jxToday =
    jxSignInfo.Sign.SignList.length > 0
      ? jxSignInfo.Sign.SignList.filter((sign) => sign.dwDayId === jxSignInfo.Sign.dwTodayId)[0]
      : undefined;
  if (!jxToday) {
    _log.push(`🟢${eventName}: 找不到京喜App签到信息 ${jxSignInfo}`);
    throw '找不到京喜App签到信息';
  }
  if (jxToday.dwStatus === 0) {
    res = await jxCfdZjbAppOrWxSignIn(cookie, jxToday, jxPhoneId);
    res ? _desc.push(`🟢${eventName} App`) : _desc.push(`🔴${eventName} App`);
  } else {
    _log.push(`🟢${eventName}: 京喜App今日已签到`);
  }
  await randomWait();
  // 微信小程序签到
  let wxSignInfo = await jxCfdZjbAppOrWxSignPage(cookie, 6);
  let wxToday =
    wxToday.Sign.SignList.length > 0
      ? wxSignInfo.Sign.SignList.filter((sign) => sign.dwDayId === wxSignInfo.Sign.dwTodayId)[0]
      : undefined;
  if (!wxToday) {
    _log.push(`🟢${eventName}: 找不到微信小程序签到信息 ${wxSignInfo}`);
    throw '找不到微信小程序签到信息';
  }
  if (wxToday.dwStatus === 0) {
    res = await jxCfdZjbAppOrWxSignIn(cookie, wxToday, jxPhoneId, 6);
    res ? _desc.push(`🟢${eventName} 微信`) : _desc.push(`🔴${eventName} 微信`);
  } else {
    _log.push(`🟢${eventName}: 微信小程序今日已签到`);
  }
}

function jxCfdZjbAppOrWxSignPage(cookie, dwEnv = 7) {
  // 赚京币 - 任务赚京币 - 连续营业赢红包 签到情况
  // dwEnv = 7 表示京喜app dwEnv = 6表示微信小程序
  const eventName = '【连续营业-任务列表】';
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/GetTakeAggrPage?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=${dwEnv}&ptag=138631.77.28&_ste=1&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198&_cfd_t=${ts()}&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone&h5st=${geth5st()}&_=${ts()}`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).iRet === 0 && JSON.parse(data).Data) {
          _log.push(`🟢${eventName} ${dwEnv === 7 ? '环境: 京喜App' : '环境: 微信小程序'}`);
          resolve(JSON.parse(data).Data);
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

function jxCfdZjbAppOrWxSignIn(cookie, sign, jxPhoneId, dwEnv = 7) {
  // 赚京币 - 任务赚京币 - 连续营业赢红包 签到
  // dwEnv = 7 表示京喜app dwEnv = 6表示微信小程序
  const eventName = `【连续营业签到-${dwEnv === 7 ? '京喜App' : '微信小程序'}】`;
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/RewardSign?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=${dwEnv}&_cfd_t=${ts()}&ptag=138631.77.28&ddwCoin=${
      sign.ddwCoin
    }&ddwMoney=${sign.ddwMoney}&dwPrizeType=${sign.dwPrizeType}&strPrizePool=${sign.strPrizePool}&dwPrizeLv=${
      sign.dwBingoLevel
    }&strPgtimestamp=${ts()}&strPhoneID=${jxPhoneId}&strPgUUNum=cbb85b208ee1346ef19b24149d7b5dcf&_stk=_cfd_t%2CbizCode%2CddwCoin%2CddwMoney%2CdwEnv%2CdwPrizeLv%2CdwPrizeType%2Cptag%2Csource%2CstrPgUUNum%2CstrPgtimestamp%2CstrPhoneID%2CstrPrizePool%2CstrZone&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).iRet === 0 && JSON.parse(data).Data) {
          if (JSON.parse(data).Data.ddwCoin > 0) {
            _jxCoins += JSON.parse(data).Data.ddwCoin / 10000;
            _log.push(`🟢${eventName}: 获得${JSON.parse(data).Data.ddwCoin / 10000}万个京币`);
          }
          if (JSON.parse(data).Data.ddwMoney > 0) {
            _rich += JSON.parse(data).Data.ddwMoney;
            _log.push(`🟢${eventName}: 获得${JSON.parse(data).Data.ddwMoney}点财富`);
          }
          if (JSON.parse(data).Data.strPrizeName.length > 0) {
            _cash += Number(JSON.parse(data).Data.strPrizeName.match(/([\d\.]+)/)[1]);
            _log.push(`🟢${eventName}: 获得${JSON.parse(data).Data.strPrizeName}现金红包`);
          }
          resolve(true);
        } else if (resp.statusCode === 200 && JSON.parse(data).iRet !== 0) {
          _log.push(`🟡${eventName}: ${JSON.parse(data).sErrMsg}`);
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

// ************************
// ***成就赚财富相关函数***
// ************************
async function jxCfdZjbGetAchieveReward(cookie) {
  const eventName = '【成就奖励】';
  const taskList = await jxCfdZjbTaskList(cookie);
  let s = 0;

  // 获取成就任务且完成的(每天都有的任务领取后prizeInfo为空)
  const achieveCompleteTaskList = taskList.filter(
    (task) => task.taskType === 11 && task.completedTimes === task.targetTimes && task.prizeInfo.length > 0
  );

  if (achieveCompleteTaskList.length) {
    for (const achieveCompleteTask of achieveCompleteTaskList) {
      (await jxCfdGetTaskReward(cookie, achieveCompleteTask)) ? s++ : null;
    }
    let icon = s === achieveCompleteTaskList.length ? '🟢' : '🟡';
    _log.push(`${icon}${eventName}: 成功领取${s}个成就奖励，总共有${achieveCompleteTaskList.length}个成就奖励可领取`);
    _desc.push(`${icon}${eventName}: ${s}/${achieveCompleteTaskList.length}`);
  } else {
    _log.push(`🟢${eventName}: 没有可领取的成就奖励`);
  }
}

async function jxCfdPickShells(cookie) {
  // 完成成就任务：去海边捡贝壳, 捡20个完成任务
  const eventName = `【去海边捡贝壳】`;
  let taskList = await jxCfdZjbTaskList(cookie);
  // taskName 去海边捡贝壳
  let pickShellsTask =
    taskList.filter((task) => task.taskId === 1309)[0] ||
    taskList.filter((task) => task.taskName === '去海边捡贝壳')[0];

  if (!pickShellsTask) {
    _log.push(`🔴${eventName}: 没有找到捡贝壳任务 ${taskList}`);
    _desc.push(`🔴${eventName}`);
    return;
  }

  if (pickShellsTask.completedTimes === pickShellsTask.targetTimes) {
    _log.push(`🟢${eventName}: 任务已完成`);
    return;
  }

  const remainTimes = pickShellsTask.targetTimes - pickShellsTask.completedTimes;
  let successTimes = 0;
  successTimes += await jxCfdPickShellByTimes(cookie, remainTimes);

  // 正常情况下，海边每次刷新10个贝壳，所以2次循环即可领取20个贝壳
  if (remainTimes > successTimes) {
    await randomWait(3000);
    successTimes += await jxCfdPickShellByTimes(cookie, remainTimes);
  }

  let icon = remainTimes === successTimes ? '🟢' : '🟡';
  _log.push(
    `${icon}${eventName}: 捡起${successTimes}个贝壳 (${pickShellsTask.completedTimes + successTimes}/${
      pickShellsTask.targetTimes
    })`
  );
  _desc.push(`${icon}${eventName}${pickShellsTask.completedTimes + successTimes}/${pickShellsTask.targetTimes}`);
}

// **********************
// ***海边贝壳相关函数***
// **********************
/**
 * @name 海边贝壳列表
 * @description 每次刷新出10个贝壳（非收藏家的贝壳，收藏家也是10个）
 * @param {*} cookie
 * @returns
 */
function jxCfdQueryShell(cookie) {
  const eventName = `【找贝壳】`;
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/queryshell?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&ptag=138631.77.28&_ste=1&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198&_cfd_t=${ts()}&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone&h5st=${geth5st()}&_=${ts()}`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (
          resp.statusCode === 200 &&
          JSON.parse(data).iRet === 0 &&
          JSON.parse(data).Data &&
          JSON.parse(data).Data.NormShell.length > 0
        ) {
          _log.push(`🟢${eventName}: 成功找到贝壳`);
          resolve(JSON.parse(data).Data);
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

function jxCfdPickShell(cookie, dwType) {
  const eventName = `【捡一个贝壳】`;
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/pickshell?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=138631.77.28&dwType=${dwType}&_stk=_cfd_t%2CbizCode%2CdwEnv%2CdwType%2Cptag%2Csource%2CstrZone&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (
          resp.statusCode === 200 &&
          JSON.parse(data).iRet === 0 &&
          JSON.parse(data).Data &&
          JSON.parse(data).Data.strFirstDesc
        ) {
          _log.push(`🟢${eventName}: ${JSON.parse(data).Data.strFirstDesc}`);
          resolve(true);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        // _desc.push(`🔴${eventName}`);
        resolve(false);
      }
    });
  });
}

async function jxCfdPickShellByTimes(cookie, times = 0) {
  // 捡N次贝壳，冗余3次
  let maxPickTimes = times + 3;
  let s = 0;
  const shellInfo = await jxCfdQueryShell(cookie);

  for (const shellList of [shellInfo.NormShell, shellInfo.CollShell]) {
    if (times === s || maxPickTimes === 0) {
      break;
    }
    if (shellList.length > 0) {
      for (const shell of shellList) {
        if (shell.dwNum > 0) {
          for (let index = 0; index < shell.dwNum; index++) {
            const res = await jxCfdPickShell(cookie, shell.dwType);
            await randomWait(500);
            if (res) {
              s++;
            }
            maxPickTimes--;
            if (times === s || maxPickTimes === 0) {
              break;
            }
          }
        }
        if (times === s || maxPickTimes === 0) {
          break;
        }
      }
    }
  }
  return s;
}

// ************************
// ****建筑升级相关函数****
// ************************

async function jxCfdBuildsLvlUp(cookie, targetTimes) {
  const eventName = '【建筑群升级】';
  // https://m.jingxi.com/jxbfd/user/QueryUserInfo 这个请求无法模拟，这里只能写死，这个请求响应中包含京币、财富、建筑等等。
  const buildsIndex = ['food', 'sea', 'shop', 'fun'];
  targetTimes = !targetTimes ? buildsIndex.length : targetTimes;
  let s = 0;
  let notCanLvlUp = 0;
  for (const buildIndex of buildsIndex) {
    const build = await jxCfdGetBuildInfo(cookie, buildIndex);
    await randomWait();

    if (build.dwCanLvlUp === 1) {
      let res = await jxCfdBuildLvlUp(cookie, buildIndex, build.ddwNextLvlCostCoin);
      res ? s++ : s;
    } else {
      notCanLvlUp++;
    }
    if (s === targetTimes) {
      _log.push(`🟢${eventName}: 指定升级${targetTimes}次成功，退出升级`);
      break;
    }
  }
  if (notCanLvlUp === buildsIndex.length) {
    _log.push(`🟡${eventName}: 所有建筑都不能升级`);
  }
  let icon = s === targetTimes ? '🟢' : '🟡';
  _log.push(`${icon}【建筑群升级】: 共升级${s}个建筑 ${s}/${targetTimes}`);
  _desc.push(`${icon}【建筑群升级】${s}/${targetTimes}`);
}

function jxCfdGetBuildInfo(cookie, buildIndex) {
  const eventName = '【建筑信息】';
  const option = getOption(
    `https://m.jingxi.com/jxbfd/user/GetBuildInfo?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&ptag=138631.77.28&_ste=1&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198&_cfd_t=${ts()}&strBuildIndex=${buildIndex}&dwType=1&_stk=_cfd_t%2CbizCode%2CdwEnv%2CdwType%2Cptag%2Csource%2CstrBuildIndex%2CstrZone&h5st=${geth5st()}&_=${ts()}`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data) && JSON.parse(data).iRet === 0) {
          const build = JSON.parse(data);
          _log.push(
            `🟢${eventName}: 建筑名称: ${build.strBuildIndex}, 等级: ${build.dwBuildLvl}, 是否可升级: ${
              build.dwCanLvlUp
            }，下一等级费用: ${build.ddwNextLvlCostCoin / 10}万京币`
          );
          resolve(JSON.parse(data));
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        // _desc.push(`🔴${eventName}`);
        resolve();
      }
    });
  });
}

function jxCfdBuildLvlUp(cookie, buildIndex, costCoin) {
  const eventName = `【升级建筑】`;
  const option = getOption(
    `https://m.jingxi.com/jxbfd/user/BuildLvlUp?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=138631.77.28&strBuildIndex=${buildIndex}&ddwCostCoin=${costCoin}&_stk=_cfd_t%2CbizCode%2CddwCostCoin%2CdwEnv%2Cptag%2Csource%2CstrBuildIndex%2CstrZone&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data) && JSON.parse(data).iRet === 0) {
          const build = JSON.parse(data);
          _rich += build.ddwSendRichValue;
          _log.push(
            `🟢${eventName}: 升级成功, 建筑名称: ${buildIndex}, 等级: ${build.dwBuildLvl}, 获得: ${build.ddwSendRichValue}财富值`
          );
          resolve(true);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        // _desc.push(`🔴${eventName}`);
        resolve(false);
      }
    });
  });
}

// **********************
// ****赚财富相关函数****
// **********************

function jxCfdZcfTaskList(cookie) {
  /**
   * Data.TaskList.dwCompleteNum = Data.TaskList.dwTargetNum:表示任务已完成
   * Data.TaskList.dwAwardStatus = 1:表示任务完成并领取奖励
   * Data.TaskList.dwCompleteNum = Data.TaskList.dwTargetNum & Data.TaskList.dwAwardStatus = 2:表示任务完成可领奖
   */
  const eventName = '【赚财富-任务列表】';
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
          resolve(JSON.parse(data).Data);
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

async function jxCfdZcfCompleteTask(cookie) {
  try {
    let eventName = `【赚财富】`;
    let num = 0;
    let tasksInfo = await jxCfdZcfTaskList(cookie);
    let taskList = tasksInfo.TaskList;
    const totalTaskNum = taskList.length;
    // 获取所有未全部完成的任务
    taskList = taskList.filter((task) => task.dwAwardStatus !== 1);
    const finishedTaskNum = totalTaskNum - taskList.length;

    if (taskList.length === 0) {
      _log.push(`🟢${eventName}: 所有任务已经完成`);
      return;
    }

    for (const task of taskList) {
      let res = false;
      // 未完成任务
      if (task.dwCompleteNum !== task.dwTargetNum) {
        // 做任务并领取奖励
        await randomWait(task.dwLookTime * 1000);
        if (task.dwTargetNum === 1) {
          if (task.ddwTaskId === 1634) {
            await jxCfdBuildsLvlUp(cookie, 1);
            continue;
          } else {
            res = await jxCfdZcfDoTask(cookie, task);
          }
        } else {
          if (task.ddwTaskId === 1630) {
            let successTimes = await jxCfdPickShellByTimes(cookie, task.dwTargetNum - task.dwCompleteNum);
            res = successTimes === task.dwTargetNum - task.dwCompleteNum ? true : false;
            let icon = res ? '🟢' : '🟡';
            _log.push(
              `${icon}${eventName}: 捡起${successTimes}个贝壳 ${task.dwCompleteNum + successTimes}/${task.dwTargetNum}`
            );
            // _desc.push(`${icon}${eventName}${task.dwCompleteNum + successTimes}/${task.dwTargetNum}`);
          } else {
            _log.push(`🔴${eventName}【${task.strTaskName}】: 任务数据异常 ${task}`);
          }
        }

        if (res) {
          res = await jxCfdGetTaskReward(cookie, task);
          res ? num++ : num + 0;
        }
      } else {
        if (task.dwAwardStatus === 2) {
          // 仅领取奖励
          _log.push(`🟢${eventName}【${task.strTaskName}】: 任务已完成，直接领取任务奖励`);
          res = await jxCfdGetTaskReward(cookie, task);
          res ? num++ : num + 0;
        } else if (task.dwAwardStatus === 1) {
          _log.push(`🟢${eventName}【${task.strTaskName}】: 任务已完成并领取过任务奖励`);
        } else {
          _log.push(`🔴${eventName}【${task.strTaskName}】: 任务数据异常 ${task}`);
        }
      }
    }

    let icon = num + finishedTaskNum === totalTaskNum ? '🟢' : '🟡';
    _desc.push(`${icon}${eventName}${num + finishedTaskNum}/${totalTaskNum}`);
  } catch (error) {
    _log.push(`🔴${eventName}: ${error}`);
    _desc.push(`🔴${eventName}`);
  }
}

async function jxCfdZcfGetFinalReward(cookie) {
  const eventName = `【赚财富终奖】`;
  let tasksInfo = await jxCfdZcfTaskList(cookie);

  // NOTE 这里不还知道怎么判断是否已经领取过终奖了，暂时每次都请求一次
  if (tasksInfo.dwCompleteTaskNum === tasksInfo.dwTotalTaskNum) {
    let res = await _jxCfdZcfGetFinalReward(cookie);
    res ? _log.push(`🟢${eventName}`) : _log.push(`🔴${eventName}`);
  }
  // else if (tasksInfo.dwCompleteTaskNum === tasksInfo.dwTotalTaskNum && tasksInfo.dwIsShowIcon === 1) {
  //   _log.push(`🟢${eventName} 今日已领取`);
  // }
  else {
    _log.push(`🔴${eventName} 数据异常 ${tasksInfo}`);
    _desc.push(`🔴${eventName}`);
  }
}

function _jxCfdZcfGetFinalReward(cookie, task) {
  const eventName = `【赚财富终奖】`;
  const option = getOption(
    `https://m.jingxi.com/jxbfd/story/ActTaskAward?strZone=jxbfd&bizCode=jxbfd&source=jxbfd&dwEnv=7&_cfd_t=${ts()}&ptag=138631.77.28&_stk=_cfd_t%2CbizCode%2CdwEnv%2Cptag%2Csource%2CstrZone&_ste=1&h5st=${geth5st()}&_=${ts()}&sceneval=2&g_login_type=1&g_ty=ls&appCode=msd1188198`,
    { Cookie: cookie, 'User-Agent': userAgent('jx'), Referer: 'https://st.jingxi.com/fortune_island/index2.html' }
  );

  return new Promise((resolve, reject) => {
    $.get(option, (err, resp, data) => {
      try {
        if (resp.statusCode === 200 && JSON.parse(data).iRet === 0 && JSON.parse(data).Data) {
          // “签到抽红包”任务特殊处理
          _rich += JSON.parse(data).Data.ddwBigReward;
          _log.push(`🟢${eventName}: 获得${JSON.parse(data).Data.ddwBigReward}财富奖励`);
          resolve(true);
        } else {
          throw err || data;
        }
      } catch (error) {
        error !== data ? _log.push(`🔴${eventName}: ${error}\n${data}`) : _log.push(`🔴${eventName}: ${error}`);
        resolve(false);
      }
    });
  });
}

function jxCfdZcfDoTask(cookie, task) {
  let eventName = `【赚财富-做任务-${task.strTaskName}】`;
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
  // 领任务完成奖（适用于赚财富任务/成就任务/赚京币任务）
  let eventName = `【领任务奖-${task.strTaskName}】`;
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
          resolve(true);
        } else if (resp.statusCode === 200 && JSON.parse(data).ret === 0) {
          const prizeInfo = JSON.parse(JSON.parse(data).data.prizeInfo);
          if (prizeInfo.ddwCoin > 0) {
            _jxCoins += prizeInfo.ddwCoin / 10000;
            _log.push(`🟢${eventName}: 获得${prizeInfo.ddwCoin / 10000}万个京币奖励`);
            resolve(true);
          } else if (prizeInfo.ddwMoney > 0) {
            _rich += prizeInfo.ddwMoney;
            _log.push(`🟢${eventName}: 获得${prizeInfo.ddwMoney}点财富`);
            resolve(true);
          } else {
            _log.push(`🔴${eventName}: 未知奖励 ${data}`);
            resolve(false);
          }
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
  _cash = _jxCoins = _rich = 0;
  _log = [`\n++++++++++${cookieObj.nickname}++++++++++\n`];
  _desc = [];

  if ($.getdata('GLOBAL_JX_CFD_OPEN_PICKSHELL') === 'true' || $.getdata('GLOBAL_JX_CFD_OPEN_PICKSHELL') === undefined) {
    // 赚京币成就任务 - 捡20个贝壳并领成就奖励（同时顺带完成赚财富捡3个贝壳任务）
    await jxCfdPickShells(cookieObj.cookie);
  }
  if ($.getdata('GLOBAL_JX_CFD_OPEN_BUILD') === 'true' || $.getdata('GLOBAL_JX_CFD_OPEN_BUILD') === undefined) {
    // 升级一轮建筑
    await jxCfdBuildsLvlUp(cookieObj.cookie);
  }
  if ($.getdata('GLOBAL_JX_CFD_OPEN_ZCF') === 'true' || $.getdata('GLOBAL_JX_CFD_OPEN_ZCF') === undefined) {
    // 赚财富所有任务
    await jxCfdZcfCompleteTask(cookieObj.cookie);
    await randomWait();
    await jxCfdZcfGetFinalReward(cookieObj.cookie);
  }

  if (cookieObj.jxPhoneId) {
    if ($.getdata('GLOBAL_JX_CFD_OPEN_ZJB_SIGN') === 'true' || $.getdata('GLOBAL_JX_CFD_OPEN_ZJB_SIGN') === undefined) {
      // 赚京币京喜App&微信小程序双签
      jxCfdZjbSignIn(cookieObj.cookie, cookieObj.jxPhoneId);
    }
    if ($.getdata('GLOBAL_JX_CFD_OPEN_ZJB_TASK') === 'true' || $.getdata('GLOBAL_JX_CFD_OPEN_ZJB_TASK') === undefined) {
      // 赚京币所有任务
      await jxCfdZjbCompleteTask(cookieObj.cookie);
    }
    if (
      $.getdata('GLOBAL_JX_CFD_OPEN_ZJB_ACHIEVE_REWARD') === 'true' ||
      $.getdata('GLOBAL_JX_CFD_OPEN_ZJB_ACHIEVE_REWARD') === undefined
    ) {
      // 领成就奖励
      await jxCfdZjbGetAchieveReward(cookieObj.cookie);
    }
  } else {
    _desc.push('请先按照重写规则说明获取一次PhoneId');
  }

  if (_desc.length > 0) {
    $.subt = `${cookieObj.nickname}, 京币: +${_jxCoins}万个, 财富: + ${_rich}点，红包: +${_cash}元`;
  } else {
    $.subt = `${cookieObj.nickname}, 一切安好，查看日志了解详情`;
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
        _log.push(`🔴${error}`);
        _desc.push(`🔴${error}`);
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
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: i, statusCode: r, headers: o, rawBody: h }, s.decode(h, this.encoding)) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: s, statusCode: r, headers: o, rawBody: h }, i.decode(h, this.encoding)) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
