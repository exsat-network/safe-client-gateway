import { MultiSendDecoder } from '@/domain/contracts/decoders/multi-send-decoder.helper';
import { ComposableCowDecoder } from '@/domain/swaps/contracts/decoders/composable-cow-decoder.helper';
import { GPv2OrderHelper } from '@/routes/transactions/helpers/gp-v2-order.helper';
import { TwapOrderHelper } from '@/routes/transactions/helpers/twap-order.helper';
import { zeroAddress } from 'viem';

describe('GPv2OrderHelper', () => {
  const target = new GPv2OrderHelper();

  const multiSendDecoder = new MultiSendDecoder();
  const composableCowDecoder = new ComposableCowDecoder();
  const twapOrderHelper = new TwapOrderHelper(
    multiSendDecoder,
    composableCowDecoder,
  );

  describe('computeOrderUid', () => {
    it('should decode the order UIDs of a direct createWithContextCall', () => {
      /**
       * @see https://sepolia.etherscan.io/address/0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74
       */
      const chainId = '11155111';
      const owner = '0x31eaC7F0141837B266De30f4dc9aF15629Bd5381';
      const data =
        '0x0d0d9800000000000000000000000000000000000000000000000000000000000000008000000000000000000000000052ed56da04309aca4c3fecc595298d80c2f16bac000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006cf1e9ca41f7611def408122793c358a3d11e5a500000000000000000000000000000000000000000000000000000019011f294a00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000be72e441bf55620febc26715db68d3494213d8cb000000000000000000000000fff9976782d46cc05630d1f6ebab18b2324d6b1400000000000000000000000031eac7f0141837b266de30f4dc9af15629bd538100000000000000000000000000000000000000000000000b941d039eed310b36000000000000000000000000000000000000000000000000087bbc924df9167e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000007080000000000000000000000000000000000000000000000000000000000000000f7be7261f56698c258bf75f888d68a00c85b22fb21958b9009c719eb88aebda00000000000000000000000000000000000000000000000000000000000000000';
      const executionDate = new Date(1718288040000);
      const twapStruct = composableCowDecoder.decodeTwapStruct(data);
      const parts = twapOrderHelper.generateTwapOrderParts({
        twapStruct,
        executionDate,
        chainId,
      });

      const orderUids = parts.map((order) =>
        target.computeOrderUid({ chainId, owner, order }),
      );

      expect(orderUids).toStrictEqual([
        '0xdaabe82f86545c66074b5565962e96758979ae80124aabef05e0585149d30f7931eac7f0141837b266de30f4dc9af15629bd5381666b05af',
        '0x557cb31a9dbbd23830c57d9fd3bbfc3694e942c161232b6cf696ba3bd11f9d6631eac7f0141837b266de30f4dc9af15629bd5381666b0cb7',
      ]);
    });

    it('should decode the order UIDs of a createWithContextCall in multiSend', () => {
      /**
       * `createWithContext` call is third transaction in batch
       * @see https://sepolia.etherscan.io/address/0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B
       */
      const chainId = '11155111';
      const owner = '0x31eaC7F0141837B266De30f4dc9aF15629Bd5381';
      const data =
        '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003cb0031eac7f0141837b266de30f4dc9af15629bd538100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f08a03230000000000000000000000002f55e8b20d0b9fefa187aa7d00b6cbe563605bf50031eac7f0141837b266de30f4dc9af15629bd5381000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000443365582cdaee378bd0eb30ddf479272accf91761e697bc00e067a268f95f1d2732ed230b000000000000000000000000fdafc9d1902f4e0b84f65f49f244b32b31013b7400fdafc9d1902f4e0b84f65f49f244b32b31013b74000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002640d0d9800000000000000000000000000000000000000000000000000000000000000008000000000000000000000000052ed56da04309aca4c3fecc595298d80c2f16bac000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006cf1e9ca41f7611def408122793c358a3d11e5a500000000000000000000000000000000000000000000000000000019011918e600000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000fff9976782d46cc05630d1f6ebab18b2324d6b14000000000000000000000000be72e441bf55620febc26715db68d3494213d8cb00000000000000000000000031eac7f0141837b266de30f4dc9af15629bd538100000000000000000000000000000000000000000000000003782dace9d90000000000000000000000000000000000000000000000000003b1b5fbf83bf2f7160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000003840000000000000000000000000000000000000000000000000000000000000000f7be7261f56698c258bf75f888d68a00c85b22fb21958b9009c719eb88aebda00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      const executionDate = new Date(1718281752000);
      const orderData = twapOrderHelper.findTwapOrder({
        // MultiSend decoder does not check validity of ComposableCow contract
        // (it recursively decodes nested transactions so uses ComposableCow from batch)
        to: zeroAddress,
        data,
      });
      if (!orderData) {
        throw new Error('Unable to find TWAP order');
      }
      const twapStruct = composableCowDecoder.decodeTwapStruct(orderData);
      const parts = twapOrderHelper.generateTwapOrderParts({
        twapStruct,
        executionDate,
        chainId,
      });

      const orderUids = parts.map((order) => {
        return target.computeOrderUid({ chainId, owner, order });
      });

      expect(orderUids).toStrictEqual([
        '0x97ad7eb9e1dd457df8b43dfd875b69dd53bd7bdc8148d48393b21b412870d85d31eac7f0141837b266de30f4dc9af15629bd5381666ae99b',
        '0xd615b06c65531e20667a7a33c7068417953cda646cc6220089f4f331c3f5029a31eac7f0141837b266de30f4dc9af15629bd5381666aed1f',
        '0xc3695c9d73a4127223a0fbd96538ce6f22121f8c869259e974a519080a91651931eac7f0141837b266de30f4dc9af15629bd5381666af0a3',
        '0x1a296dbc504c1b3385c1510d70e519ff95804a7da5caa8d3fc2920e05be4a52731eac7f0141837b266de30f4dc9af15629bd5381666af427',
      ]);
    });
  });
});
