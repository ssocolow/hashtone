  const init = async () => {

        const { bitcoin: { mempool } } = mempoolJS({
          hostname: 'mempool.space'
        });

        const getMempoolTxids = await mempool.getMempoolTxids();

        document.getElementById("result").textContent = JSON.stringify(getMempoolTxids, undefined, 2);

      };
      init();

