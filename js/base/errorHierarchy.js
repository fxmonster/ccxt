'use strict';

const errorHierarchy = {
    'BaseError': {
        'ExchangeError': {
            'AuthenticationError': {
                'PermissionDenied': {
                    'AccountNotEnabled': {},
                },
                'AccountSuspended': {},
            },
            'ArgumentsRequired': {},
            'BadRequest': {
                'BadSymbol': {},
                'MarginModeAlreadySet': {},
            },
            'BadResponse': {
                'NullResponse': {},
            },
            'InsufficientFunds': {},
            'InvalidAddress': {
                'AddressPending': {},
            },
            'InvalidOrder': {
                'OrderNotFound': {},
                'OrderNotCached': {},
                'CancelPending': {},
                'OrderImmediatelyFillable': {},
                'OrderNotFillable': {},
                'DuplicateOrderId': {},
            },
            'InvalidPosition': {
                'PositionNotFound': {},
            },
            'NotSupported': {},
        },
        'NetworkError': {
            'DDoSProtection': {
                'RateLimitExceeded': {},
            },
            'ExchangeNotAvailable': {
                'OnMaintenance': {},
            },
            'InvalidNonce': {},
            'RequestTimeout': {},
        },
    },
};

module.exports = errorHierarchy;
