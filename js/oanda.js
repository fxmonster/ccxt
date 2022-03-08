'use strict';

// ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { ExchangeError, InvalidOrder, AuthenticationError, ArgumentsRequired, BadSymbol, BadRequest, OrderNotFound } = require ('./base/errors');
const Precise = require ('./base/Precise');

// ---------------------------------------------------------------------------

module.exports = class oanda extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'oanda',
            'name': 'Oanda',
            // Crypto is offered to the following OANDA divisions: OANDA Global Markets, OANDA Europe Markets (but not OANDA Europe Limited), OANDA Australia and OANDA Asia Pacific.
            'countries': [ 'EN' ], // England
            'rateLimit': 8.34, // https://developer.oanda.com/rest-live-v20/development-guide/
            'version': 'v3',
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': true,
                'swap': true,
                'future': false,
                'option': false,
                'addMargin': false,
                'cancelAllOrders': false,
                'cancelOrder': true,
                'createMarketOrder': false,
                'createOrder': true,
                'createReduceOnlyOrder': false,
                'editOrder': true,
                'fetchBalance': true,
                'fetchCanceledOrders': true,
                'fetchClosedOrders': true,
                'fetchDepositAddress': false,
                'fetchDepositAddressesByNetwork': false,
                'fetchDeposits': false,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchIsolatedPositions': false,
                'fetchLedger': true,
                'fetchLeverage': true,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchOrdersByIds': true,
                'fetchOrderTrades': true,
                'fetchPosition': true, // removed because of emulation, will be implemented in base later
                'fetchPositions': true,
                'fetchPositionsRisk': undefined,
                'fetchPremiumIndexOHLCV': false,
                'fetchStatus': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': false,
                'fetchTrades': false,
                'fetchWithdrawals': false,
                'private': true,
                'public': false,
                'reduceMargin': false,
                'setLeverage': true,
                'setMarginMode': false,
                'withdraw': false,
            },
            'timeframes': {
                '5s': 'S5',
                '10s': 'S10',
                '15s': 'S15',
                '30s': 'S30',
                '1m': 'M1',
                '2m': 'M2',
                '4m': 'M4',
                '5m': 'M5',
                '10m': 'M10',
                '15m': 'M15',
                '30m': 'M30',
                '1h': 'H1',
                '2h': 'H2',
                '3h': 'H3',
                '4h': 'H4',
                '6h': 'H6',
                '8h': 'H8',
                '12h': 'H12',
                '1d': 'D',
                '1w': 'W',
                '1M': 'M',
            },
            'urls': {
                'logo': '',
                'api': {
                    'public': 'https://api-fxtrade.oanda.com',
                    'private': 'https://api-fxtrade.oanda.com',
                },
                'test': {
                    'public': 'https://api-fxpractice.oanda.com',
                    'private': 'https://api-fxpractice.oanda.com',
                },
                'www': 'https://www.oanda.com/',
                'doc': [
                    'https://developer.oanda.com/',
                    'https://oanda-api-v20.readthedocs.io/',
                ],
                'fees': [
                    'https://www.oanda.com/bvi-en/cfds/our-pricing/',
                ],
                'referral': '',
            },
            'api': {
                'public': {
                    'get': {
                    },
                },
                // apikey (account id) - https://www.oanda.com/funding/ ; secret - https://www.oanda.com/account/tpa/personal_token;
                'private': {
                    'get': {
                        'accounts': 1,
                        'accounts/{accountID}': 1,
                        'accounts/{accountID}/summary': 1, // example response: same as above, but without 'trades'|'orders'|'positions' properties
                        'accounts/{accountID}/instruments': 1,
                        'accounts/{accountID}/changes': 1,
                        'instruments/{instrument}/candles': 1,
                        'instruments/{instrument}/orderBook': 1,
                        'instruments/{instrument}/positionBook': 1,
                        'instruments/{instrument}/recentHourlyOrderBooks': 1, // undocumented, as they have incomplete api
                        'instruments/{instrument}/recentHourlyPositionBooks': 1, // undocumented, as they have incomplete api
                        'accounts/{accountID}/orders': 1,
                        'accounts/{accountID}/pendingOrders': 1, // TO_DO
                        'accounts/{accountID}/orders/{orderSpecifier}': 1,
                        'accounts/{accountID}/trades': 1,
                        'accounts/{accountID}/trades/{tradeSpecifier}': 1,
                        'accounts/{accountID}/positions': 1,
                        'accounts/{accountID}/openPositions': 1,
                        'accounts/{accountID}/positions/{instrument}': 1,
                        'accounts/{accountID}/transactions': 1,
                        'accounts/{accountID}/transactions/{transactionID}': 1,
                        'accounts/{accountID}/transactions/idrange': 1,
                        'accounts/{accountID}/transactions/sinceid': 1,
                        'accounts/{accountID}/transactions/stream': 1,
                        'accounts/{accountID}/candles/latest': 1, // unclear difference compared to 'instrument/candles'
                        'accounts/{accountID}/pricing': 1,
                        'accounts/{accountID}/instruments/{instrument}/candles': 1, // unclear difference compared to 'instrument/candles'
                    },
                    'patch': {
                        'accounts/{accountID}/configuration': 1,
                    },
                    'post': {
                        'accounts/{accountID}/orders': 1,
                    },
                    'put': {
                        'accounts/{accountID}/orders/{orderSpecifier}': 1, // replace order (cancels & recreates)
                        'accounts/{accountID}/orders/{orderSpecifier}/cancel': 1,
                        'accounts/{accountID}/orders/{orderSpecifier}/clientExtensions': 1,
                        'accounts/{accountID}/trades/{tradeSpecifier}/close': 1,
                        'accounts/{accountID}/trades/{tradeSpecifier}/clientExtensions': 1,
                        'accounts/{accountID}/trades/{tradeSpecifier}/orders': 1,
                        'accounts/{accountID}/positions/{instrument}/close': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    // 'maker': 0.2 / 100,
                    // 'taker': 0.2 / 100,
                },
            },
            'options': {
                'defaultType': 'swap',
                // Oanda has a buggy/incomplete api endpoint. They do return instruments, that work with some endpoints (also in UI charts, like CN50/USD: https://trade.oanda.com/ ) but, some of those instruments are not available for orderbooks, and from API, there is no way to find out which symbols have orderbooks and which doesn't have. So, I've hardcoded them according to the list from their Web-UI.
                'allowedOrdebookSymbols': [ 'AUD/JPY', 'AUD/USD', 'EUR/AUD', 'EUR/CHF', 'EUR/GBP', 'EUR/JPY', 'EUR/USD', 'GBP/CHF', 'GBP/JPY', 'GBP/USD', 'NZD/USD', 'USD/CAD', 'USD/CHF', 'USD/JPY', 'XAU/USD', 'XAG/USD' ],
            },
            'requiredCredentials': {
                'apiKey': true, // this needs to be an account-id
                'secret': true, // this needs to be a 'secret-token'
            },
            'commonCurrencies': {
            },
            'exceptions': {
                // https://developer.oanda.com/rest-live-v20/transaction-df/
                'exact': {
                    'UNITS_INVALID': BadRequest, // {"orderRejectTransaction":{"id":"64","accountID":"001-004-123456-001","userID":123456,"batchID":"64","requestID":"24910393117751396","time":"2022-02-06T07:40:36.837630106Z","type":"LIMIT_ORDER_REJECT","instrument":"EUR_USD","units":"0","price":"1212","timeInForce":"GTC","triggerCondition":"DEFAULT","partialFill":"DEFAULT","positionFill":"DEFAULT","reason":"CLIENT_ORDER","rejectReason":"UNITS_INVALID"},"relatedTransactionIDs":["64"],"lastTransactionID":"64","errorMessage":"Order units specified are invalid","errorCode":"UNITS_INVALID"}
                    'PRICE_INVALID': BadRequest,
                    'UNITS_LIMIT_EXCEEDED': BadRequest,
                    'oanda::rest::core::InvalidParameterException': BadRequest,
                    'ORDER_DOESNT_EXIST': OrderNotFound,
                    'NO_SUCH_ORDER': OrderNotFound,
                    'INVALID_PAGESIZE': BadRequest,
                    'MARGIN_RATE_INVALID': BadRequest,
                },
                'broad': {
                    'Maximum value for ': BadRequest, // {"errorMessage":"Maximum value for 'count' exceeded"}
                    "Invalid value specified for 'instrument'": BadSymbol, // {"errorMessage":"Invalid value specified for 'instrument'"}
                    'Invalid value specified for ': BadRequest, // {"errorMessage":"Invalid value specified for 'from'"}
                    ' is not a valid instrument.': BadSymbol,
                    'Invalid Instrument ': BadSymbol,
                    'The request was missing required data': BadRequest,
                    'The provided request was forbidden': AuthenticationError,
                    'Insufficient authorization to perform request': AuthenticationError,
                    'The order ID specified does not exist': OrderNotFound,
                    'The trade ID specified does not exist': BadRequest,
                    'The transaction ID specified does not exist': BadRequest,
                    'The units specified exceeds the maximum number of units allowed': BadRequest,
                    'The Order specified does not exist': OrderNotFound,
                    'The specified page size is invalid': BadRequest,
                    'The margin rate provided is invalid': BadRequest,
                },
            },
        });
    }

    async fetchMarkets (params = {}) {
        // possible 'type' param: 'CURRENCY', 'CFD', 'METAL'
        const response = await this.privateGetAccountsAccountIDInstruments (params);
        //
        //     {
        //         instruments: [
        //             {
        //                 name: 'GBP_CAD',
        //                 type: 'CURRENCY',
        //                 displayName: 'GBP/CAD',
        //                 pipLocation: '-4',
        //                 displayPrecision: '5',
        //                 tradeUnitsPrecision: '0',
        //                 minimumTradeSize: '1',
        //                 maximumTrailingStopDistance: '1.00000',
        //                 minimumTrailingStopDistance: '0.00050',
        //                 maximumPositionSize: '0',
        //                 maximumOrderUnits: '100000000',
        //                 marginRate: '0.0333',
        //                 guaranteedStopLossOrderMode: 'ALLOWED',
        //                 minimumGuaranteedStopLossDistance: '0.0010',
        //                 guaranteedStopLossOrderExecutionPremium: '0.00050',
        //                 guaranteedStopLossOrderLevelRestriction: { volume: '1000000', priceRange: '0.00250' },
        //                 tags: [ { type: 'ASSET_CLASS', name: 'CURRENCY' } ],
        //                 financing: {
        //                     longRate: '-0.0105',
        //                     shortRate: '-0.0145',
        //                     financingDaysOfWeek: [
        //                         { dayOfWeek: 'MONDAY', daysCharged: '1' },
        //                         { dayOfWeek: 'TUESDAY', daysCharged: '1' },
        //                         { dayOfWeek: 'WEDNESDAY', daysCharged: '3' },
        //                         { dayOfWeek: 'THURSDAY', daysCharged: '1' },
        //                         { dayOfWeek: 'FRIDAY', daysCharged: '1' },
        //                         { dayOfWeek: 'SATURDAY', daysCharged: '0' },
        //                         { dayOfWeek: 'SUNDAY', daysCharged: '0' }
        //                     ]
        //                 }
        //             },
        //         ]
        //         lastTransactionID: '3'
        //     }
        //
        const data = this.safeValue (response, 'instruments');
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const market = data[i];
            const id = this.safeString (market, 'name');
            const [ baseId, quoteId ] = id.split ('_');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            const type = 'spot';
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'settle': undefined,
                'baseId': baseId,
                'quoteId': quoteId,
                'settleId': undefined,
                'type': type,
                'spot': true,
                'margin': true,
                'swap': false,
                'future': false,
                'option': false,
                'contract': false,
                'linear': undefined,
                'inverse': undefined,
                'taker': this.safeNumber (market, 'takerFee'),
                'maker': this.safeNumber (market, 'makerFee'),
                'contractSize': undefined,
                'active': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'precision': {
                    'amount': this.safeNumber (market, 'tradeUnitsPrecision'),
                    'price': this.safeNumber (market, 'displayPrecision'),
                },
                'limits': {
                    'leverage': {
                        'min': this.parseNumber ('1'),
                        'max': undefined,
                    },
                    'amount': {
                        'min': this.safeString (market, 'minimumTradeSize'),
                        'max': undefined,
                    },
                    'price': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'instrument': market['id'],
            'granularity': this.timeframes[timeframe],
            'price': 'BMA', // https://developer.oanda.com/rest-live-v20/primitives-df/#PricingComponent
        };
        // from & to : 'RFC 3339' or 'UNIX' format
        if (since !== undefined) {
            const start = parseInt (since / 1000);
            request['from'] = start;
        }
        if (limit !== undefined) {
            request['count'] = Math.min (limit, 5000);
        }
        const response = await this.privateGetInstrumentsInstrumentCandles (this.extend (request, params));
        //
        //     {
        //         instrument: 'GBP_USD',
        //         granularity: 'S5',
        //         candles: [
        //             {
        //                 complete: true, // might be false to last current bar
        //                 volume: '1',
        //                 time: '2022-02-02T14:13:40.000000000Z',
        //                 bid: { o: '1.35594', h: '1.35595', l: '1.35590', c: '1.35591' }, // if 'B' flag used
        //                 mid: { o: '1.35600', h: '1.35602', l: '1.35596', c: '1.35598' }, // if 'M' flag used
        //                 ask: { o: '1.35607', h: '1.35608', l: '1.35602', c: '1.35604' }  // if 'A' flag used
        //             },
        //         ]
        //     }
        //
        const data = this.safeValue (response, 'candles', []);
        return this.parseOHLCVs (data, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market = undefined) {
        //
        //     [
        //         0.042398, // 0 open
        //         0.042684, // 1 high
        //         0.042366, // 2 low
        //         0.042386, // 3 close
        //         0.93734243, // 4 volume
        //         1611514800, // 5 timestamp
        //     ]
        //
        const dateString = this.safeString (ohlcv, 'time');
        const timestamp = this.parseDate (dateString);
        const bidObject = this.safeValue (ohlcv, 'bid');
        const askObject = this.safeValue (ohlcv, 'ask');
        const midObject = this.safeValue (ohlcv, 'mid');
        return [
            timestamp,
            this.safeNumber (midObject, 'o'),
            this.safeNumber (askObject, 'h'),
            this.safeNumber (bidObject, 'l'),
            this.safeNumber (midObject, 'c'),
            this.safeNumber (ohlcv, 'volume'),
        ];
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        // Note: Oanda doesn't provide orderbooks for all markets. Check options['allowedOrdebookSymbols'] for allowed symbols.
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'instrument': market['id'],
        };
        const response = await this.privateGetInstrumentsInstrumentOrderBook (this.extend (request, params));
        //
        //     {
        //         orderBook: {
        //         instrument: 'GBP_USD',
        //         time: '2022-02-02T15:40:00Z',
        //         unixTime: '1643816400',
        //         price: '1.35683',
        //         bucketWidth: '0.00050',
        //         buckets: [
        //             { price: '1.29150', longCountPercent: '0.0063', shortCountPercent: '0.0000' },
        //             { price: '1.29300', longCountPercent: '0.0063', shortCountPercent: '0.0000' },
        //             { price: '1.29350', longCountPercent: '0.0000', shortCountPercent: '0.0063' },
        //         ]
        //     }
        //
        const orderbookObject = this.safeValue (response, 'orderBook');
        const timestamp = this.safeTimestamp (orderbookObject, 'unixTime');
        return this.parseOrderBook (orderbookObject, symbol, timestamp);
    }

    parseOrderBook (orderbook, symbol, timestamp = undefined, bidsKey = 'Buy', asksKey = 'Sell', priceKey = 'price', amountKey = 0) {
        const buckets = this.safeValue (orderbook, 'buckets', []);
        const medianPrice = this.safeString (orderbook, 'price');
        // const bucketWidth = this.safeValue (orderbook, 'bucketWidth');
        const bids = [];
        const asks = [];
        for (let i = 0; i < buckets.length; i++) {
            const bucket = buckets[i];
            const price = this.safeString (bucket, priceKey);
            const longCountPercent = this.safeString (bucket, 'longCountPercent');
            const shortCountPercent = this.safeString (bucket, 'shortCountPercent');
            const volume = Precise.stringAdd (longCountPercent, shortCountPercent);
            if (Precise.stringGt (medianPrice, price)) {
                bids.push ([ this.parseNumber (price), this.parseNumber (volume) ]);
            } else if (Precise.stringLt (medianPrice, price)) {
                asks.push ([ this.parseNumber (price), this.parseNumber (volume) ]);
            } else {
                throw new ExchangeError (this.id + ' parseOrderBook encountered an unrecognized item of bidask: ' + this.json (bucket));
            }
        }
        return {
            'symbol': symbol,
            'bids': this.sortBy (bids, 0, true),
            'asks': this.sortBy (asks, 0),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'nonce': undefined,
        };
    }

    buildOrderRequest (symbol, type, side, amount, price = undefined, params = {}) {
        const market = this.market (symbol);
        const requestOrder = {
            'instrument': market['id'],
            // timeInForce : (TimeInForce, required, default=GTC),
        };
        requestOrder['type'] = this.parseOrderType (type, true); // TO_DO> Docs says: "...Must be set to 'LIMIT' when creating a Market Order...". However, in example "timeInForce": "FOK", & "type": "MARKET"
        if (price !== undefined) {
            requestOrder['price'] = this.priceToPrecision (symbol, price);
        }
        amount = this.amountToPrecision (symbol, amount);
        requestOrder['units'] = side === 'buy' ? amount : -amount; // A positive number of units results in a long Order, and a negative number of units results in a short Order.
        const request = { 'order': requestOrder };
        return [ market, request ];
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        const [ market, request ] = this.buildOrderRequest (symbol, type, side, amount, price, params);
        const response = await this.privatePostAccountsAccountIDOrders (this.extend (request, params));
        //
        //     {
        //         orderCreateTransaction: {
        //             id: '13',
        //             accountID: '001-004-1234567-001',
        //             userID: '1234567',
        //             batchID: '13',
        //             requestID: '132995756821489501',
        //             time: '2022-02-03T11:38:15.490811234Z',
        //             type: 'LIMIT_ORDER',
        //             instrument: 'USD_JPY',
        //             units: '-1',
        //             price: '101.000',
        //             timeInForce: 'GTC',
        //             triggerCondition: 'DEFAULT',
        //             partialFill: 'DEFAULT',
        //             positionFill: 'DEFAULT',
        //             reason: 'CLIENT_ORDER'
        //         },
        //         // .................. Note: if order crosses orderBook, then the response has 'orderFillTransaction' too
        //         orderFillTransaction: {
        //             id: '14',
        //             accountID: '001-004-1234567-001',
        //             userID: '1234567',
        //             batchID: '13',
        //             requestID: '132995756821489501',
        //             time: '2022-02-03T11:38:15.490811234Z',
        //             type: 'ORDER_FILL',
        //             orderID: '13',
        //             instrument: 'USD_JPY',
        //             units: '-1',
        //             requestedUnits: '-1',
        //             price: '114.824',
        //             pl: '0.0000',
        //             quotePL: '0',
        //             financing: '0.0000',
        //             baseFinancing: '0',
        //             commission: '0.0000',
        //             accountBalance: '20.0000',
        //             gainQuoteHomeConversionFactor: '0.008664945317',
        //             lossQuoteHomeConversionFactor: '0.008752030194',
        //             guaranteedExecutionFee: '0.0000',
        //             quoteGuaranteedExecutionFee: '0',
        //             halfSpreadCost: '0.0001',
        //             fullVWAP: '114.824',
        //             reason: 'LIMIT_ORDER',
        //             tradeOpened: [Object],
        //             fullPrice: [Object],
        //             homeConversionFactors: [Object]
        //         },
        //         // .................. Note: if order is rejected, then the response has 'orderCancelTransaction' too
        //         orderCancelTransaction: {
        //             id: '69',
        //             accountID: '001-004-1234567-001',
        //             userID: '1234567',
        //             batchID: '68',
        //             requestID: '24910396909826154',
        //             time: '2022-02-06T07:55:40.491081947Z',
        //             type: 'ORDER_CANCEL',
        //             orderID: '68',
        //             reason: 'MARKET_HALTED'
        //         },
        //         relatedTransactionIDs: [ '13', '14' ],
        //         lastTransactionID: '14'
        //     }
        //
        return this.parseOrder (response, market);
    }

    async editOrder (id, symbol, type, side, amount = undefined, price = undefined, params = {}) {
        await this.loadMarkets ();
        const [ market, request ] = this.buildOrderRequest (symbol, type, side, amount, price, params);
        request['orderSpecifier'] = id;
        const response = await this.privatePutAccountsAccountIDOrdersOrderSpecifier (this.extend (request, params));
        //
        //     {
        //         orderCancelTransaction: {
        //             id: '43',
        //             accountID: '001-004-1234567-001',
        //             userID: '1234567',
        //             batchID: '43',
        //             requestID: '114981813471441232',
        //             time: '2022-02-04T17:46:54.522571338Z',
        //             type: 'ORDER_CANCEL',
        //             orderID: '42',
        //             replacedByOrderID: '44',
        //             reason: 'CLIENT_REQUEST_REPLACED'
        //         },
        //         orderCreateTransaction: {
        //             id: '44',
        //             accountID: '001-004-1234567-001',
        //             userID: '1234567',
        //             batchID: '43',
        //             requestID: '114981813471441232',
        //             time: '2022-02-04T17:46:54.522571338Z',
        //             type: 'LIMIT_ORDER',
        //             instrument: 'EUR_USD',
        //             units: '1',
        //             price: '0.98700',
        //             timeInForce: 'GTC',
        //             triggerCondition: 'DEFAULT',
        //             partialFill: 'DEFAULT',
        //             positionFill: 'DEFAULT',
        //             reason: 'REPLACEMENT',
        //             replacesOrderID: '42'
        //         },
        //         relatedTransactionIDs: [ '43', '44' ],
        //         lastTransactionID: '44'
        //     }
        //
        return this.parseOrder (response, market);
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        //  this.loadMarkets ();
        const request = {
            'orderSpecifier': id,
        };
        const response = await this.privatePutAccountsAccountIDOrdersOrderSpecifierCancel (this.extend (request, params));
        //
        //     {
        //         orderCancelTransaction: {
        //           id: '51',
        //           accountID: '001-004-1234567-001',
        //           userID: '1234567',
        //           batchID: '51',
        //           requestID: '78953047329468193',
        //           time: '2022-02-04T17:58:18.182828031Z',
        //           type: 'ORDER_CANCEL',
        //           orderID: '50',
        //           reason: 'CLIENT_REQUEST'
        //         },
        //         relatedTransactionIDs: [ '51' ],
        //         lastTransactionID: '51'
        //     }
        //
        return this.parseOrder (response);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'orderSpecifier': id,
        };
        const response = await this.privateGetAccountsAccountIDOrdersOrderSpecifier (this.extend (request, params));
        //
        //     {
        //         order: {
        //           id: '17',
        //           createTime: '2022-02-03T10:39:02.123450098Z',
        //           type: 'MARKET',
        //           instrument: 'USD_JPY',
        //           units: '1',
        //           timeInForce: 'FOK',
        //           positionFill: 'REDUCE_ONLY',
        //           state: 'FILLED',
        //           fillingTransactionID: '18',
        //           filledTime: '2022-02-03T10:39:02.123450098Z',
        //           tradeClosedIDs: [ '10' ]
        //         },
        //         lastTransactionID: '42'
        //     }
        //
        const order = this.safeValue (response, 'order', {});
        return this.parseOrder (order);
    }

    async fetchOrdersByIds (ids = undefined, since = undefined, limit = undefined, params = {}) {
        const idsString = Array.isArray (ids) ? ids.join (',') : ids;
        const request = {
            'ids': idsString,
            'state': 'ALL',
        };
        return this.fetchOrders (undefined, since, limit, this.extend (request, params));
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return await this.fetchOrders (symbol, since, limit, this.extend ({ 'state': 'PENDING' }, params));
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return await this.fetchOrders (symbol, since, limit, this.extend ({ 'state': 'TRIGGERED' }, params));
    }

    async fetchCanceledOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return await this.fetchOrders (symbol, since, limit, this.extend ({ 'state': 'CANCELLED' }, params));
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const state = this.safeString (params, 'state', 'ALL');
        const request = {
            'state': state,
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['instrument'] = market['symbol'];
        }
        if (limit !== undefined) {
            request['count'] = limit; // default 20, max 200
        }
        const response = await this.privateGetAccountsAccountIDOrders (this.extend (request, params));
        // Note the difference between FILLED & CANCELLED object keys: price & below 'state' properties
        // {
        //     orders: [
        //       {
        //         id: '19',
        //         createTime: '2022-02-03T12:13:45.123704227Z',
        //         type: 'MARKET',
        //         instrument: 'USD_JPY',
        //         units: '1',
        //         timeInForce: 'FOK',
        //         positionFill: 'REDUCE_ONLY',
        //         state: 'FILLED',
        //         fillingTransactionID: '20',
        //         filledTime: '2022-02-03T12:13:45.123704227Z',
        //         tradeClosedIDs: ['14']
        //       },
        //       {
        //         id: '7',
        //         createTime: '2022-02-03T07:56:42.515274170Z',
        //         type: 'LIMIT',
        //         instrument: 'USD_JPY',
        //         units: '1',
        //         timeInForce: 'GTC',
        //         price: '101.000',
        //         triggerCondition: 'DEFAULT',
        //         partialFill: 'DEFAULT_FILL',
        //         positionFill: 'DEFAULT',
        //         state: 'CANCELLED',
        //         cancellingTransactionID: '8',
        //         cancelledTime: '2022-02-03T07:57:51.937254136Z'
        //       }
        //       ...
        //     ],
        //     lastTransactionID: '20'
        // }
        const orders = this.safeValue (response, 'orders', []);
        return this.parseOrders (orders, market, since, limit, params);
    }

    parseOrder (order, market = undefined) {
        let id = undefined;
        let marketId = undefined;
        let timestamp = undefined;
        let type = undefined;
        let price = undefined;
        let timeInForce = undefined;
        let amount = undefined;
        let filled = undefined;
        let remaining = undefined;
        let status = undefined;
        let side = undefined;
        if ('orderCreateTransaction' in order) { // comes from 'createOrder' or 'editOrder', however, this key has different order
            const orderCreateTransaction = this.safeValue (order, 'orderCreateTransaction');
            const orderCancelTransaction = this.safeValue (order, 'orderCancelTransaction');
            const keys = Object.keys (order);
            const keysLength = keys.length;
            // Note: in 'editOrder', the first key is always 'orderCancelTransaction', in createOrder, it's 'orderCreateTransaction'
            const lastKey = this.safeString (keys, keysLength - 1);
            // const orderFillTransaction = this.safeValue (order, 'orderFillTransaction'); // TO_DO : this is for 'trades'
            id = this.safeString (orderCreateTransaction, 'id');
            marketId = this.safeString (orderCreateTransaction, 'instrument');
            timestamp = this.parseDate (this.safeString (orderCreateTransaction, 'time'));
            price = this.safeString (orderCreateTransaction, 'price');
            timeInForce = this.parseTimeInForce (this.safeString (orderCreateTransaction, 'timeInForce'));
            amount = this.safeString (orderCreateTransaction, 'units');
            side = Precise.stringGt (amount, '0') ? 'buy' : 'sell';
            amount = Precise.stringAbs (amount);
            type = this.parseOrderTransactionType (this.safeString (orderCreateTransaction, 'type'));
            let tempStatus = undefined;
            // depending the last key, we find out the order status.
            if (lastKey === 'orderCancelTransaction') { // if cancellation order followed immediatelly, then it's rejection
                // tempStatus = 'REJECTED';
                const cancelReason = this.safeString (orderCancelTransaction, 'reason');
                throw new InvalidOrder (this.id + ' createOrder() : ' + cancelReason); // TODO
            } else if (lastKey === 'orderFillTransaction') { // if it has fill, then it's either full fill or partial fill
                tempStatus = 'FILLED';
            } else if (lastKey === 'orderCreateTransaction') { // if last was also just order-creation (without fill) then it's pending
                tempStatus = 'PENDING';
            }
            status = this.parseOrderStatus (tempStatus);
        } else if ('orderCancelTransaction' in order) { // if not create/edit order, then it's from 'cancelOrder'
            const chosenOrder = this.safeValue (order, 'orderCancelTransaction');
            id = this.safeString (chosenOrder, 'orderID');
            timestamp = this.parseDate (this.safeString (chosenOrder, 'time'));
        } else if ('createTime' in order) { // from 'fetchOrder' & 'fetchOrders'
            const chosenOrder = order;
            id = this.safeString (chosenOrder, 'id');
            marketId = this.safeString (chosenOrder, 'instrument');
            timestamp = this.parseDate (this.safeString (chosenOrder, 'createTime'));
            price = this.safeString (chosenOrder, 'price');
            timeInForce = this.parseTimeInForce (this.safeString (chosenOrder, 'timeInForce'));
            amount = this.safeString (chosenOrder, 'units');
            side = Precise.stringGt (amount, '0') ? 'buy' : 'sell';
            amount = Precise.stringAbs (amount);
            type = this.parseOrderType (this.safeString (chosenOrder, 'type'));
            const state = this.safeString (chosenOrder, 'state');
            status = this.parseOrderStatus (state);
            if (state === 'FILLED') {
                filled = amount;
            } else if (state === 'PENDING' || state === 'TRIGGERED') {
                remaining = amount;
            }
        }
        return this.safeOrder ({
            'id': id,
            'clientOrderId': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'status': status,
            'type': type,
            'side': side,
            'symbol': this.safeSymbol (marketId, market),
            'timeInForce': timeInForce,
            'postOnly': undefined,
            'price': price,
            'stopPrice': undefined,
            'average': undefined,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'cost': undefined,
            'trades': undefined,
            'fee': undefined,
            'info': order,
        }, market);
    }

    parseOrderStatus (status) {
        const statuses = {
            'PENDING': 'open',
            'FILLED': 'closed',
            'TRIGGERED': 'closed',
            'CANCELLED': 'canceled',
            'REJECTED': 'rejected',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrderType (status) {
        const statuses = {
            'MARKET': 'market',
            'LIMIT': 'limit',
            'STOP': 'stop',
            // 'GUARANTEED_STOP_LOSS': 'stop-limit',
            // 'STOP_LOSS': 'stop-loss',
            // 'TAKE_PROFIT': 'take-profit',
            // 'MARKET_IF_TOUCHED': 'mit',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrderTransactionType (status) {
        const statuses = {
            'MARKET_ORDER': 'market',
            'LIMIT_ORDER': 'limit',
            'STOP_ORDER': 'stop',
            // 'GUARANTEED_STOP_LOSS_ORDER': 'stop-limit',
            // 'STOP_LOSS_ORDER': 'stop-loss',
            // 'TAKE_PROFIT_ORDER': 'take-profit',
            // 'MARKET_IF_TOUCHED_ORDER': 'mit',
            // statuses
            'ORDER_CANCEL': 'cancel',
            'ORDER_FILL': 'close',
        };
        return this.safeString (statuses, status, status);
    }

    parseTimeInForce (timeInForce) {
        const statuses = {
            'GTC': 'GTC',
            'IOC': 'IOC',
            'FOK': 'FOK',
            'GTD': 'GTD',
        };
        return this.safeString (statuses, timeInForce, timeInForce);
    }

    async fetchPositions (symbols = undefined, params = {}) {
        const request = { 'state': 'OPEN' };
        const positions = await this.getInternalAccountTrades (symbols, undefined, this.extend (request, params));
        return this.parsePositions (positions, symbols);
    }

    parsePositions (positions, symbols = undefined) {
        const result = [];
        for (let i = 0; i < positions.length; i++) {
            const parsed = this.parsePosition (positions[i], undefined, symbols);
            if (parsed !== undefined) {
                result.push (parsed);
            }
        }
        return result;
    }

    parsePosition (position, market = undefined) {
        //
        // fetchPositions
        //
        //     {
        //         id: '54',
        //         instrument: 'EUR_USD',
        //         price: '1.14531',
        //         openTime: '2022-02-04T18:47:36.387316038Z',
        //         initialUnits: '2',
        //         state: 'OPEN',
        //         currentUnits: '2',
        //         realizedPL: '0.0000',
        //         financing: '0.0000',
        //         dividendAdjustment: '0.0000',
        //         unrealizedPL: '-0.0003',
        //         marginUsed: '0.2290'
        //     }
        //
        const marketId = this.safeString (position, 'instrument');
        market = this.safeMarket (marketId, market, '_');
        const date = this.safeString (position, 'openTime');
        const timestamp = this.parseDate (date);
        const initialSize = this.safeString (position, 'initialUnits');
        const side = Precise.stringGt (initialSize, '0') ? 'long' : 'short';
        const marginUsed = this.safeString (position, 'marginUsed');
        // TODO: i am not sure if the margin values are correctly structured by me
        return {
            'id': this.safeString (position, 'id'),
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'initialMargin': undefined,
            'initialMarginPercentage': undefined,
            'maintenanceMargin': undefined,
            'maintenanceMarginPercentage': undefined,
            'collateral': marginUsed,
            'entryPrice': this.safeNumber (position, 'price'),
            'notional': undefined,
            'leverage': undefined,
            'unrealizedPnl': this.safeNumber (position, 'unrealisedPnl'),
            'contracts': this.parseNumber (Precise.stringAbs (initialSize)),
            'contractSize': undefined,
            'realisedPnl': this.safeNumber (position, 'realizedPL'),
            'marginRatio': undefined,
            'liquidationPrice': undefined,
            'markPrice': undefined,
            'marginType': undefined,
            'side': side,
            'percentage': undefined,
            'status': this.parsePositionStatus (this.safeString (position, 'state')),
            'info': position,
        };
    }

    parsePositionStatus (status) {
        let statuses = {
            'ALL': 'all',
            'OPEN': 'open',
            'CLOSED': 'closed',
            'CLOSE_WHEN_TRADEABLE': 'unknown',
        };
        return this.safeString (statuses, status, status);
    }

    async getInternalTransactionsData (since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let results = [];
        const request = {};
        // TODO: docs says, that default is 'account creation time' ( https://developer.oanda.com/rest-live-v20/transaction-ep/ ) but actually it's not true. if 'from' not provided, it is being set by exchange 1 week ago.
        if (since === undefined) {
            request['from'] = 0; // let's set it to zero, so provides 'all' data fromt he beggining (as we don't know 'account creation time')
        } else {
            request['from'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['pageSize'] = limit;
        }
        const response = await this.privateGetAccountsAccountIDTransactions (this.extend (request, params));
        // {
        //     from: '2022-01-29T18:28:00.006101091Z',
        //     to: '2022-02-05T18:28:00.006101091Z',
        //     pageSize: '100',
        //     count: '57',
        //     pages: [
        //       'https://api-fxtrade.oanda.com/v3/accounts/001-004-1234567-001/transactions/idrange?from=104&to=160'
        //     ],
        //     lastTransactionID: '160'
        // }
        const pages = this.safeValue (response, 'pages');
        const pagesLength = pages.length;
        for (let i = 0; i < pagesLength; i++) {
            const link = pages[i];
            const splitArray = link.split ('from=');
            const lastpart = this.safeString (splitArray, 1, '');
            const lastSplitArray = lastpart.split ('&');
            const fromId = this.safeInteger (lastSplitArray, 0);
            const paramsWithoutId = this.omit (params, 'id');
            const response = await this.privateGetAccountsAccountIDTransactionsSinceid (this.extend ({ 'id': fromId }, paramsWithoutId));
            //
            // {
            //    transactions: [
            //       {
            //         "id": '59',
            //         "accountID": '001-004-1234567-001',
            //         "userID": '1234567',
            //         'batchID": '59',
            //         "requestID": '78953049230723855',
            //         "time": '2022-02-04T19:57:09.583582923Z',
            //         "type": 'MARKET_ORDER',
            //         "instrument": 'EUR_USD',
            //         "units": '-5',
            //         "timeInForce": 'FOK',
            //         "positionFill": 'REDUCE_ONLY',
            //         "reason": 'TRADE_CLOSE',
            //         "tradeClose": [...]
            //       },
            //       {
            //         "id": "60",
            //         "accountID": "001-004-1234567-001",
            //         "userID": "1474544",
            //         "batchID": "59",
            //         "requestID": "78953049230723855",
            //         "time": "2022-02-04T19:57:09.583582923Z",
            //         "type": "ORDER_FILL",
            //         "orderID": "59",
            //         "instrument": "EUR_USD",
            //         "units": "-5",
            //         "requestedUnits": "-5",
            //         "price": "1.14508",
            //         "pl": "-0.0023",
            //         "quotePL": "-0.00230",
            //         "financing": "0.0000",
            //         "baseFinancing": "0.00000000000000",
            //         "commission": "0.0000",
            //         "accountBalance": "19.9947",
            //         "gainQuoteHomeConversionFactor": "1",
            //         "lossQuoteHomeConversionFactor": "1",
            //         "guaranteedExecutionFee": "0.0000",
            //         "quoteGuaranteedExecutionFee": "0",
            //         "halfSpreadCost": "0.0002",
            //         "fullVWAP": "1.14508",
            //         "reason": "MARKET_ORDER_TRADE_CLOSE",
            //         "tradesClosed": [
            //           {
            //             "tradeID": "58",
            //             "units": "-5",
            //             "realizedPL": "-0.0023",
            //             "financing": "0.0000",
            //             "baseFinancing": "0.00000000000000",
            //             "price": "1.14508",
            //             "guaranteedExecutionFee": "0.0000",
            //             "quoteGuaranteedExecutionFee": "0",
            //             "halfSpreadCost": "0.0002",
            //             "plHomeConversionCost": "0.00000",
            //             "baseFinancingHomeConversionCost": "0.00000000000000",
            //             "guaranteedExecutionFeeHomeConversionCost": "0",
            //             "homeConversionCost": "0.00000000000000"
            //           }
            //         ],
            //         "fullPrice": {
            //           "closeoutBid": "1.14504",
            //           "closeoutAsk": "1.14521",
            //           "timestamp": "2022-02-04T19:57:05.356995798Z",
            //           "bids": [
            //             { "price": "1.14508", "liquidity": "1000000" },
            //             { "price": "1.14507", "liquidity": "2000000" },
            //             { "price": "1.14506", "liquidity": "2000000" },
            //             { "price": "1.14504", "liquidity": "5000000" }
            //           ],
            //           "asks": [
            //             { "price": "1.14517", "liquidity": "1000000" },
            //             { "price": "1.14519", "liquidity": "2000000" },
            //             { "price": "1.14520", "liquidity": "2000000" },
            //             { "price": "1.14521", "liquidity": "5000000" }
            //           ]
            //         },
            //         "homeConversionFactors": {
            //           "gainQuoteHome": { "factor": "1" },
            //           "lossQuoteHome": { "factor": "1" },
            //           "gainBaseHome": { "factor": "1.13939440" },
            //           "lossBaseHome": { "factor": "1.15084560" }
            //         },
            //         "plHomeConversionCost": "0.00000",
            //         "baseFinancingHomeConversionCost": "0.00000000000000",
            //         "guaranteedExecutionFeeHomeConversionCost": "0",
            //         "homeConversionCost": "0.00000000000000"
            //     },
            //   ],
            //   lastTransactionID: '60'
            // }
            //
            results = this.safeValue (response, 'transactions', []);
        }
        return results;
    }

    async fetchLedger (code = undefined, since = undefined, limit = undefined, params = {}) {
        const results = await this.getInternalTransactionsData (since, limit, params);
        // see response sample inside above method
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        return this.parseLedger (results, currency, since, limit);
    }

    parseLedgerEntry (item, currency = undefined) {
        const id = this.safeString (item, 'id');
        const type = this.safeString (item, 'type');
        const typeParsed = this.parseLedgerEntryType (type);
        const date = this.safeString (item, 'time');
        const timestamp = this.parseDate (date);
        const account = this.safeString (item, 'accountID');
        const referenceId = this.safeString (item, 'requestID'); // batchID or requestID
        const referenceAccount = undefined;
        const marketId = this.safeString (item, 'instrument');
        const market = this.safeMarket (marketId, undefined);
        const code = undefined;
        const amountString = this.safeString (item, 'units');
        const direction = Precise.stringGt (amountString, '0') ? 'in' : 'out';
        const amount = this.parseNumber (Precise.stringAbs (amountString));
        const balanceAfter = this.safeNumber (item, 'accountBalance');
        const status = 'ok';
        return {
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'direction': direction,
            'account': account,
            'referenceId': referenceId,
            'referenceAccount': referenceAccount,
            'type': typeParsed,
            'currency': code,
            'symbol': market['symbol'],
            'amount': amount,
            'before': undefined,
            'after': balanceAfter,
            'status': status,
            'fee': undefined,
            'info': item,
        };
    }

    parseLedgerEntryType (type) {
        const types = {
            'ORDER': 'trade',
            'FUNDING': 'transaction',
            // 'ADMIN': '',
            // 'CREATE': '',
            // 'CLOSE': '',
            // 'REOPEN': '',
            // 'CLIENT_CONFIGURE': '',
            // 'CLIENT_CONFIGURE_REJECT': '',
            'TRANSFER_FUNDS': 'transaction',
            'TRANSFER_FUNDS_REJECT': 'transaction',
            'MARKET_ORDER': 'trade',
            'MARKET_ORDER_REJECT': 'trade',
            'LIMIT_ORDER': 'trade',
            'LIMIT_ORDER_REJECT': 'trade',
            'STOP_ORDER': 'trade',
            'STOP_ORDER_REJECT': 'trade',
            'MARKET_IF_TOUCHED_ORDER': 'trade',
            'MARKET_IF_TOUCHED_ORDER_REJECT': 'trade',
            'TAKE_PROFIT_ORDER': 'trade',
            'TAKE_PROFIT_ORDER_REJECT': 'trade',
            'STOP_LOSS_ORDER': 'trade',
            'STOP_LOSS_ORDER_REJECT': 'trade',
            'GUARANTEED_STOP_LOSS_ORDER': 'trade',
            'GUARANTEED_STOP_LOSS_ORDER_REJECT': 'trade',
            'TRAILING_STOP_LOSS_ORDER': 'trade',
            'TRAILING_STOP_LOSS_ORDER_REJECT': 'trade',
            'ONE_CANCELS_ALL_ORDER': 'trade',
            'ONE_CANCELS_ALL_ORDER_REJECT': 'trade',
            'ONE_CANCELS_ALL_ORDER_TRIGGERED': 'trade',
            'ORDER_FILL': 'trade',
            'ORDER_CANCEL': 'trade',
            'ORDER_CANCEL_REJECT': 'trade',
            'ORDER_CLIENT_EXTENSIONS_MODIFY': 'trade',
            'ORDER_CLIENT_EXTENSIONS_MODIFY_REJECT': 'trade',
            'TRADE_CLIENT_EXTENSIONS_MODIFY': 'trade',
            'TRADE_CLIENT_EXTENSIONS_MODIFY_REJECT': 'trade',
            'MARGIN_CALL_ENTER': 'margin',
            'MARGIN_CALL_EXTEND': 'margin',
            'MARGIN_CALL_EXIT': 'margin',
            'DELAYED_TRADE_CLOSURE': 'trade',
            'DAILY_FINANCING': 'transaction',
            'RESET_RESETTABLE_PL': 'margin',
        };
        return this.safeString (types, type, type);
    }

    async fetchAccountDetails (params) {
        const response = await this.privateGetAccountsAccountIDSummary (params);
        //
        //     {
        //         account: {
        //             guaranteedStopLossOrderMode: 'ALLOWED',
        //             hedgingEnabled: false,
        //             id: '001-004-1234567-001',
        //             createdTime: '2017-06-19T18:08:13.242573669Z',
        //             currency: 'USD',
        //             createdByUserID: '1234567',
        //             alias: 'Primary',
        //             marginRate: '332333',
        //             lastTransactionID: '74',
        //             balance: '19.9947',
        //             openTradeCount: '0',
        //             openPositionCount: '0',
        //             pendingOrderCount: '0',
        //             pl: '-0.0053',
        //             resettablePL: '-0.0053',
        //             resettablePLTime: '2017-06-19T18:08:13.242573669Z',
        //             financing: '0.0000',
        //             commission: '0.0000',
        //             dividendAdjustment: '0',
        //             guaranteedExecutionFees: '0.0000',
        //             unrealizedPL: '0.0000',
        //             NAV: '19.9947',
        //             marginUsed: '0.0000',
        //             marginAvailable: '19.9947',
        //             positionValue: '0.0000',
        //             marginCloseoutUnrealizedPL: '0.0000',
        //             marginCloseoutNAV: '19.9947',
        //             marginCloseoutMarginUsed: '0.0000',
        //             marginCloseoutPositionValue: '0.0000',
        //             marginCloseoutPercent: '0.00000',
        //             withdrawalLimit: '19.9947',
        //             marginCallMarginUsed: '0.0000',
        //             marginCallPercent: '0.00000'
        //         },
        //         lastTransactionID: '74'
        //     }
        //
        return this.safeValue (response, 'account', {});
    }

    async fetchBalance (params = {}) {
        const entry = await this.fetchAccountDetails (params);
        const currencyId = this.safeString (entry, 'currency');
        const code = this.safeCurrencyCode (currencyId);
        const currentBalance = this.safeNumber (entry, 'balance');
        const result = {
            'timestamp': undefined,
            'datetime': undefined,
            'info': entry,
        };
        const account = this.account ();
        account['free'] = currentBalance;
        account['used'] = undefined;
        result[code] = account;
        return this.safeBalance (result);
    }

    async fetchLeverage (symbol, params = {}) {
        const entry = await this.fetchAccountDetails (params);
        return this.safeNumber (entry, 'marginRate');
    }

    async fetchTransactions (code = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'type': 'FUNDING,TRANSFER_FUNDS',
        };
        const currency = (code === undefined) ? undefined : this.currency (code);
        const ledgerEntries = await this.fetchLedger (code, since, limit, this.extend (request, params));
        // Note about 'amount': POSITIVE is DEPOSIT, NEGATIVE is WITHDRAW
        //
        // [
        //   {
        //     id: '1166',
        //     userID: '1234567',
        //     accountID: '001-004-1234567-003',
        //     batchID: '1166',
        //     requestID: '1735692509328716553',
        //     time: '2017-09-03T23:30:15.418701565Z',
        //     accountBalance: '400.0054',
        //     type: 'TRANSFER_FUNDS',
        //     amount: '400.0000000000',
        //     fundingReason: 'CLIENT_FUNDING'
        //   },
        //   {
        //     id: '1551',
        //     userID: '1234567',
        //     accountID: '001-004-1234567-003',
        //     batchID: '1551',
        //     requestID: '1735784887540766275',
        //     time: '2018-05-16T21:28:17.013486674Z',
        //     accountBalance: '12.7652',
        //     type: 'TRANSFER_FUNDS',
        //     amount: '0.0600000000',
        //     fundingReason: 'ADJUSTMENT'
        //  },
        //  ..
        // ]
        const rows = [];
        for (let i = 0; i < ledgerEntries.length; i++) {
            const ledgerEntry = ledgerEntries[i];
            rows.push (this.safeValue (ledgerEntry, 'info'));
        }
        return this.parseTransactions (rows, currency, since, limit, params);
    }

    parseTransaction (transaction, currency = undefined) {
        const id = this.safeString (transaction, 'id');
        const amount = this.safeNumber (transaction, 'amount');
        const amountStr = this.safeString (transaction, 'amount');
        const isIncome = Precise.stringGt (amountStr, '0');
        const txid = this.safeString (transaction, 'requestID');
        const trType = this.safeString (transaction, 'type');
        const fundingReason = this.safeString (transaction, 'fundingReason');
        let type = undefined;
        if (trType === 'TRANSFER_FUNDS') {
            if (fundingReason === 'CLIENT_FUNDING') {
                type = isIncome ? 'deposit' : 'withdrawal';
            } else {
                type = fundingReason;
            }
        }
        const date = this.safeString (transaction, 'time');
        const timestamp = this.parseDate (date);
        currency = this.safeCurrency (undefined, currency);
        const code = this.safeString (currency, 'code');
        return {
            'id': id,
            'currency': code,
            'amount': amount,
            'network': undefined,
            'address': undefined,
            'addressTo': undefined,
            'addressFrom': undefined,
            'tag': undefined,
            'tagTo': undefined,
            'tagFrom': undefined,
            'status': undefined,
            'type': this.parseTransactionType (type),
            'updated': undefined,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'fee': {
                'currency': code,
                'cost': undefined,
            },
            'info': transaction,
        };
    }

    parseTransactionType (type) {
        const types = {
            'deposit': 'deposit',
            'withdrawal': 'withdrawal',
        };
        return this.safeString (types, type, type);
    }

    async fetchTicker (symbol, params = {}) {
        const data = await this.fetchTickers ([ symbol ], params);
        return this.safeValue (data, symbol, {});
    }

    async fetchTickers (symbols = undefined, params = {}) {
        if (symbols === undefined) {
            throw new ArgumentsRequired (this.id + ' ' + 'fetchTickers() requires symbols argument');
        }
        const ids = [];
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            ids.push (market['id']);
        }
        const request = {
            'instruments': ids.join (','),
        };
        const response = await this.privateGetAccountsAccountIDPricing (this.extend (request, params));
        //
        //     {
        //         time: '2022-02-04T22:01:37.508039596Z',
        //         prices: [
        //             {
        //                 type: 'PRICE',
        //                 time: '2022-02-04T21:58:01.634671962Z',
        //                 bids: [
        //                     { price: '1.14508', liquidity: '1000000' },
        //                     { price: '1.14507', liquidity: '2000000' },
        //                     { price: '1.14506', liquidity: '2000000' },
        //                 ],
        //                 asks: [
        //                     { price: '1.14525', liquidity: '1000000' },
        //                     { price: '1.14527', liquidity: '2000000' },
        //                     { price: '1.14528', liquidity: '2000000' },
        //                 ],
        //                 closeoutBid: '1.14504',
        //                 closeoutAsk: '1.14529',
        //                 status: 'non-tradeable',
        //                 tradeable: false,
        //                 quoteHomeConversionFactors: { positiveUnits: '1.00000000', negativeUnits: '1.00000000' },
        //                 instrument: 'EUR_USD'
        //             },
        //         ]
        //     }
        //
        const prices = this.safeValue (response, 'prices', []);
        return this.parseTickers (prices, symbols, params);
    }

    parseTicker (ticker, market = undefined) {
        const marketId = this.safeString (ticker, 'instrument');
        market = this.safeMarket (marketId, market);
        // const status = this.safeString (ticker, 'status') === 'tradeable';
        const date = this.safeString (ticker, 'time');
        const timestamp = this.parseDate (date);
        const bids = this.safeValue (ticker, 'bids');
        const asks = this.safeValue (ticker, 'asks');
        const bidBestObject = this.safeValue (bids, 0);
        const askBestObject = this.safeValue (asks, 0);
        const bidPrice = this.safeNumber (bidBestObject, 'price');
        const bidVolume = this.safeNumber (bidBestObject, 'liquidity');
        const askPrice = this.safeNumber (askBestObject, 'price');
        const askVolume = this.safeNumber (askBestObject, 'liquidity');
        return this.safeTicker ({
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': undefined,
            'low': undefined,
            'bid': bidPrice,
            'bidVolume': bidVolume,
            'ask': askPrice,
            'askVolume': askVolume,
            'vwap': undefined,
            'open': undefined,
            'close': undefined,
            'last': undefined,
            'previousClose': undefined,
            'change': undefined,
            'percentage': this.safeString (ticker, 'percentChange'),
            'average': undefined,
            'baseVolume': this.safeString (ticker, 'baseVolume'),
            'quoteVolume': this.safeString (ticker, 'quoteVolume'),
            'info': ticker,
        }, market, false);
    }

    async getInternalAccountTrades (symbols = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {};
        if (limit !== undefined) {
            request['count'] = limit;
        }
        if (symbols !== undefined) {
            const symbolsLength = symbols.length;
            if (symbolsLength === 1) {
                request['instrument'] = symbols[0];
            }
        }
        request['state'] = this.safeString (params, 'state', 'ALL'); // state:  All, OPEN, CLOSED, CLOSE_WHEN_TRADEABLE
        const response = await this.privateGetAccountsAccountIDTrades (this.extend (request, params));
        // Note, if state 'CLOSED' positions are requested, they will have some additional properties, as seen in below objects:
        //
        // {
        //     trades: [
        //       {
        //         id: '54',
        //         instrument: 'EUR_USD',
        //         price: '1.14531',
        //         openTime: '2022-02-04T18:47:36.387316038Z',
        //         initialUnits: '2',
        //         state: 'OPEN',
        //         currentUnits: '2',
        //         realizedPL: '0.0000',
        //         financing: '0.0000',
        //         dividendAdjustment: '0.0000',
        //         unrealizedPL: '-0.0003',
        //         marginUsed: '0.2290'
        //       },
        //       ...
        //       {
        //         id: '10',
        //         instrument: 'USD_JPY',
        //         price: '114.581',
        //         openTime: '2022-02-03T08:00:15.098811956Z',
        //         initialUnits: '-1',
        //         initialMarginRequired: '0.1000',
        //         state: 'CLOSED',
        //         currentUnits: '0',
        //         realizedPL: '-0.0023',
        //         closingTransactionIDs: [ '60' ],
        //         financing: '0.0000',
        //         dividendAdjustment: '0.0000',
        //         closeTime: '2022-02-03T11:39:02.279740098Z',
        //         averageClosePrice: '114.842'
        //       }
        //       ...
        //     ],
        //     lastTransactionID: '54'
        // }
        return this.safeValue (response, 'trades', []);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        let response = undefined;
        let method = this.safeString (this.options, 'fetchMyTradesMethod', 'privateGetAccountsAccountIDTransactionsSinceid');
        method = this.safeString (params, 'method', method);
        if (method === 'privateGetAccountsAccountIDTransactionsSinceid') {
            const request = { 'type': 'ORDER_FILL' };
            response = await this.getInternalTransactionsData (since, limit, this.extend (request, params));
        } else {
            const request = { 'state': 'CLOSED' };
            response = await this.getInternalAccountTrades (undefined, since, limit, this.extend (request, params));
        }
        return this.parseTrades (response, market, since, limit, params);
    }

    parseTrade (trade, market = undefined) {
        const date = this.safeString2 (trade, 'time', 'closeTime');
        const timestamp = this.parseDate (date);
        const amountStr = this.safeString2 (trade, 'units', 'initialUnits');
        const side = Precise.stringGt (amountStr, '0') ? 'buy' : 'sell';
        const marketId = this.safeString (trade, 'instrument');
        market = this.safeMarket (marketId, market);
        let type = this.safeString (trade, 'type');
        if (type !== undefined) {
            type = this.parseOrderType (type);
        }
        const commission = this.safeString (trade, 'commission');
        let fee = undefined;
        if (commission !== undefined) {
            fee = {
                'currency': undefined,
                'cost': commission,
            };
        }
        return this.safeTrade ({
            'id': this.safeString (trade, 'id'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': this.safeString2 (trade, 'orderID', 'batchID'),
            'type': type,
            'takerOrMaker': undefined,
            'side': side,
            'price': this.safeNumber2 (trade, 'price', 'averageClosePrice'),
            'amount': this.parseNumber (Precise.stringAbs (amountStr)),
            'cost': undefined,
            'fee': fee,
            'info': trade,
        }, market);
    }

    async setLeverage (leverage, symbol = undefined, params = {}) {
        const request = {
            'marginRate': leverage,
        };
        const response = this.privatePatchAccountsAccountIDConfiguration (this.extend (request, params));
        //
        //     {
        //         clientConfigureTransaction: {
        //             id: '4',
        //             accountID: '001-002-1234567-001',
        //             userID: '1234567',
        //             batchID: '4',
        //             requestID: '9456734987654321',
        //             time: '2022-02-02T08:22:56.543732155Z',
        //             type: 'CLIENT_CONFIGURE',
        //             marginRate: '2'
        //         },
        //         lastTransactionID: '4'
        //     }
        //
        return response;
    }

    changeKeyValue (obj) { // TODO: this method might live in base. this is being used for reverse-parsing or associated key-values
        const result = {};
        const keys = Object.keys (obj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = obj[key];
            result[value] = key;
        }
        return result;
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        if (path.indexOf ('{accountID}') >= 0) { // when accountID is in path, but not provided, use the default one
            params['accountID'] = this.safeValue (params, 'accountID', this.apiKey);
        }
        let url = this.urls['api'][api] + '/' + this.version + '/' + this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (method === 'GET' && Object.keys (query).length) {
            url += '?' + this.urlencode (query);
        }
        if (api === 'private') {
            this.checkRequiredCredentials ();
            const timestamp = this.milliseconds ().toString ();
            if (method !== 'GET') {
                body = this.json (query);
            }
            headers = {
                'Authorization': 'Bearer ' + this.secret,
                'Content-Type': 'application/json',
                'timestamp': timestamp,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (httpCode, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (!response) {
            return; // fallback to default error handler
        }
        const errorMessage = this.safeString (response, 'errorMessage', '');
        const errorCode = this.safeString (response, 'errorCode', '');
        if (errorMessage !== '') {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], errorMessage, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
    }
};
