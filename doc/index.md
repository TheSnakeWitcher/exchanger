# Solidity API

## Exchanger

### feeFactor

```solidity
uint256 feeFactor
```

### constructor

```solidity
constructor(uint256 _feeFactor) public
```

### listItem

```solidity
function listItem(uint256 id, uint64 deadline, uint256 amount) public
```

### listItem

```solidity
function listItem(uint256 id, uint64 deadline, uint256 amount, address token) public
```

### buyItem

```solidity
function buyItem(uint256 id) external payable
```

Buy a token and transfer it to the caller

_`price` and `token` must match the expected purchase price and token to prevent front-running attacks_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being purchased Requirements: - `id` must exist and be listed for sale - `price` must matches the expected purchase price to prevent front-running attacks - `token` must matches the expected purchase token to prevent front-running attacks - Caller must be able to pay the listed price for `id` - Must emit a {Purchased} event |

### delistItem

```solidity
function delistItem(uint256 id) external
```

Remove the listing for `id`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being delisted Requirements: - `id` must exist and be listed for sale - Caller must be owner, authorised operators or approved address of the token - Must emit an {UpdateListing} event |

### setFeeFactor

```solidity
function setFeeFactor(uint256 _feeNumerator) external
```

### getListing

```solidity
function getListing(uint256 id) external view returns (struct IExchanger.Order)
```

Return the listing for `id`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | identifier of the token being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IExchanger.Order | the specified listing (deadline, price, token) |

## IExchanger

### OrderState

```solidity
enum OrderState {
  NonExistent,
  Initialized,
  Paid
}
```

### Order

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Order {
  address seller;
  uint256 deadline;
  uint256 amount;
  address token;
  enum IExchanger.OrderState state;
}
```

### OrderCreated

```solidity
event OrderCreated(uint256 id, address seller, uint256 deadline, uint256 amount, address token)
```

Emitted when a item is listed for sale

_The `price` and `deadline`can't be 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being listed |
| seller | address | - address of who is selling the token |
| deadline | uint256 | - UNIX timestamp, the buyer could buy the token before deadline |
| amount | uint256 | - the price the token is being sold for |
| token | address | - contract addresses of supported token or zero address(for eth) |

### OrderPurchased

```solidity
event OrderPurchased(uint256 id, address from, address to, uint256 amount, address token)
```

Emitted when a item is being purchased

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being purchased |
| from | address | - address of who is selling the token |
| to | address | - address of who is buying the token |
| amount | uint256 | - the price the token is being sold for |
| token | address | - contract addresses of supported token or zero address(for ETH) |

### OrderDeleted

```solidity
event OrderDeleted(uint256 id)
```

Emitted when a item is being purchased

### InvalidOrderData

```solidity
error InvalidOrderData()
```

### InvalidOrderState

```solidity
error InvalidOrderState()
```

used when a item is being purchased

### InvalidOrderSeller

```solidity
error InvalidOrderSeller()
```

used when trying to delete a already paid order

### InvalidOrderBuyer

```solidity
error InvalidOrderBuyer()
```

used when trying change a order from other seller

### listItem

```solidity
function listItem(uint256 id, uint64 deadline, uint256 price) external
```

Create or update a listing for `id` with `benchmarkPrice`

_`price` MUST NOT be set to zero_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being listed |
| deadline | uint64 | - UNIX timestamp, the buyer could buy the token before deadline |
| price | uint256 | - the price the token is being sold for Requirements: - `id` must not exist - `deadline` must be greater that current block timestamp - `price` must be greater than zero - Must emit an {OrderCreated} event. |

### listItem

```solidity
function listItem(uint256 id, uint64 deadline, uint256 price, address token) external
```

Create or update a listing for `id` with `benchmarkPrice`

_`price` MUST NOT be set to zero_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being listed |
| deadline | uint64 | - UNIX timestamp, the buyer could buy the token before deadline |
| price | uint256 | - the price the token is being sold for |
| token | address | - contract addresses of supported token or zero address                         The zero address indicates that the supported token is ETH                         Buyer needs to purchase item with supported token Requirements: - `id` must not exist - Caller must be owner, authorised operators or approved address of the token - `price` must not be zero - `deadline` must be valid - Must emit an {OrderCreated} event. |

### delistItem

```solidity
function delistItem(uint256 id) external
```

Remove the listing for `id`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being delisted Requirements: - `id` must exist and be listed for sale - Caller must be owner, authorised operators or approved address of the token - Must emit an {UpdateListing} event |

### buyItem

```solidity
function buyItem(uint256 id) external payable
```

Buy a token and transfer it to the caller

_`price` and `token` must match the expected purchase price and token to prevent front-running attacks_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | - identifier of the token being purchased Requirements: - `id` must exist and be listed for sale - `price` must matches the expected purchase price to prevent front-running attacks - `token` must matches the expected purchase token to prevent front-running attacks - Caller must be able to pay the listed price for `id` - Must emit a {Purchased} event |

### getListing

```solidity
function getListing(uint256 id) external view returns (struct IExchanger.Order)
```

Return the listing for `id`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | identifier of the token being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IExchanger.Order | the specified listing (deadline, price, token) |

## MockERC20

### constructor

```solidity
constructor(string name_, string symbol_) public
```

