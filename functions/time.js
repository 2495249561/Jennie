export function onRequest(context) {
  // 定义歌词库
  const lyrics = [
    "I'm going solo lo lo lo lo lo...",
    "Look at me, look at you...",
    "Been around the world, pearls on my neck.",
    "JENNIE in your area!",
    "Shining solo.",
    "I'm sitting on my throne."
  ];

  // 随机选择一句歌词
  const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)];

  // 直接返回歌词，不再包含时间
  return new Response(`JENNIE: "${randomLyric}"`, {
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
