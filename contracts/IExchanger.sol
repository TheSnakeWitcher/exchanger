//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26 ;
pragma abicoder v2 ;

interface IExchanger {

    enum OrderState {
        NonExistent,
        Initialized,
        Paid,
        Completed
    }

    /**
     * @param seller - seller or the item
     * @param deadline - UNIX block timestamp when order expires
     * @param amount - the amount of asset requested by the seller
     * @param token - the token requested by the seller where address(0) is the native coin
     * @param paid - determine if the order is paid by a buyer
     */
    struct Order {
        address seller ;
        uint256 deadline ;
        uint256 amount ;
        address token ;
        OrderState state ;
    }

    /**
     * @notice Emitted when a item is listed for sale
     * @dev The `price` and `deadline`can't be 0
     * @param id - identifier of the token being listed
     * @param seller - address of who is selling the token
     * @param deadline - UNIX timestamp, the buyer could buy the token before deadline
     * @param amount - the price the token is being sold for
     * @param token - contract addresses of supported token or zero address(for eth)
     */ 
    event OrderCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 deadline,
        uint256 amount,
        address token
    );

    /**
     * @notice Emitted when a item is being purchased
     * @param id - identifier of the token being purchased
     * @param from - address of who is selling the token
     * @param to - address of who is buying the token 
     * @param amount - the price the token is being sold for
     * @param token - contract addresses of supported token or zero address(for ETH)
     */
    event OrderPurchased(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        address token
    );

    /// @notice Emitted when a item is being purchased
    event OrderCompleted(uint256 indexed id);

    /// @notice Emitted when a item is being purchased
    event OrderDeleted(uint256 indexed id); 

    error InvalidOrderData() ;   /// @notice used when a item is being purchased
    error InvalidOrderState() ;  /// @notice used when trying to delete a already paid order
    error InvalidOrderSeller() ; /// @notice used when trying change a order from other seller
    error InvalidOrderBuyer() ;  /// @notice used when trying buy an order from other seller

    /**
     * @notice Create or update a listing for `id` with `benchmarkPrice`
     * @dev `price` MUST NOT be set to zero
     * @param id - identifier of the token being listed
     * @param deadline - UNIX timestamp, the buyer could buy the token before deadline
     * @param price - the price the token is being sold for
     * Requirements:
     * - `id` must not exist
     * - `deadline` must be greater that current block timestamp
     * - `price` must be greater than zero
     * - Must emit an {OrderCreated} event.
     */
    function listItem(uint256 id, uint64 deadline, uint256 price) external ;


    /**
     * @notice Create or update a listing for `id` with `benchmarkPrice`
     * @dev `price` MUST NOT be set to zero
     * @param id - identifier of the token being listed
     * @param deadline - UNIX timestamp, the buyer could buy the token before deadline
     * @param price - the price the token is being sold for
     * @param token - contract addresses of supported token or zero address
     *                         The zero address indicates that the supported token is ETH
     *                         Buyer needs to purchase item with supported token
     * Requirements:
     * - `id` must not exist
     * - Caller must be owner, authorised operators or approved address of the token
     * - `price` must not be zero
     * - `deadline` must be valid
     * - Must emit an {OrderCreated} event.
     */
    function listItem(uint256 id, uint64 deadline, uint256 price, address token) external;

    /**
     * @notice Remove the listing for `id`
     * @param id - identifier of the token being delisted
     * Requirements:
     * - `id` must exist and be listed for sale
     * - Caller must be owner, authorised operators or approved address of the token
     * - Must emit an {UpdateListing} event
     */
    function delistItem(uint256 id) external;

    /**
     * @notice Buy a token and transfer it to the caller
     * @dev `price` and `token` must match the expected purchase price and token to prevent front-running attacks
     * @param id - identifier of the token being purchased
     * Requirements:
     * - `id` must exist and be listed for sale
     * - `price` must matches the expected purchase price to prevent front-running attacks
     * - `token` must matches the expected purchase token to prevent front-running attacks
     * - Caller must be able to pay the listed price for `id`
     * - Must emit a {Purchased} event
     */ 
    function buyItem(uint256 id) external payable;

    /**
    * @notice Return the listing for `id`
    * @param id identifier of the token being queried
    * @return the specified listing (deadline, price, token)
    */
    function getListing(uint256 id) external view returns (Order memory);

}
