//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26 ;
pragma abicoder v2 ;


import { Address } from "@openzeppelin/contracts/utils/Address.sol" ;
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol" ;
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol" ;

import "./IExchanger.sol" ;


/**
 * @title Exchanger
 * @author Alejandro Virelles <thesnakewitcher@gmail.com>
 */
contract Exchanger is Ownable, ReentrancyGuard, IExchanger {

    uint256 public feeFactor ;
    mapping(uint256 id => Order order) private _orders ;

    constructor(uint256 _feeFactor) Ownable(_msgSender()) {
        _setFeeFactor(_feeFactor) ;
    }

    function buyItem(uint256 id) external payable nonReentrant {
        Order memory order = _orders[id] ;
        require(
            order.state == OrderState.Initialized &&
            block.timestamp <=  order.deadline,
            IExchanger.InvalidOrderState()
        );

        address buyer = _msgSender() ;
        require(
            order.seller !=  buyer,
            IExchanger.InvalidOrderBuyer()
        );

        _chargeFees(order) ;
        _orders[id].state = OrderState.Paid ;
        emit OrderPurchased(id, order.seller, buyer, order.amount, order.token) ;
    }

    function delistItem(uint256 id) external {
        Order memory order = _orders[id] ;
        address sender = _msgSender() ;

        require(
            order.state == OrderState.Initialized,
            IExchanger.InvalidOrderState()
        ) ;
        require(
             sender == order.seller || sender == owner(),
            IExchanger.InvalidOrderSeller()
        ) ;

        delete _orders[id] ;
        emit OrderDeleted(id) ;
    }

    function complete(uint256 id) external onlyOwner {
        require(_orders[id].state == OrderState.Paid, IExchanger.InvalidOrderState() );
        _orders[id].state =  OrderState.Completed ;
        emit OrderCompleted(id) ;
    }

    function withdraw(uint256 id) external {
        Order memory order = _orders[id] ;
        require(order.seller == _msgSender(), IExchanger.InvalidOrderSeller() );
        require(order.state == OrderState.Completed, IExchanger.InvalidOrderState() );

        uint256 fee = _getFeeOf(order.amount) ;
        if (order.token == address(0)) {
            Address.sendValue(payable(owner()), fee) ;
            Address.sendValue(payable(order.seller), order.amount) ;
        } else {
            IERC20(order.token).transfer(owner(), fee) ;
            IERC20(order.token).transfer(order.seller, order.amount) ;
        }
    }

    function setFeeFactor(uint256 _feeNumerator) external onlyOwner {
        _setFeeFactor(_feeNumerator) ;
    }

    function getListing(uint256 id) external view returns (Order memory) {
        return _orders[id] ;
    }

    function listItem(uint256 id, uint64 deadline, uint256 amount) public {
        listItem(id, deadline, amount, address(0)) ;
    }

    function listItem(uint256 id, uint64 deadline, uint256 amount, address token) public {
        require(
            _orders[id].state == OrderState.NonExistent &&
            deadline > block.timestamp &&
            amount > 0,
            IExchanger.InvalidOrderData()
        );

        Order memory order = Order({
            seller: _msgSender(),
            deadline: deadline,
            amount: amount,
            token: token,
            state: OrderState.Initialized
        }) ;

        _orders[id] = order ;
        emit OrderCreated(id, _msgSender(), deadline, amount, token) ;
    }

    function _chargeFees(Order memory order) private {
        uint256 payment = order.amount + _getFeeOf(order.amount) ;
        if ( order.token != address(0)) {
            IERC20(order.token).transferFrom(_msgSender(), address(this), payment) ;
        } else {
            require(msg.value >= payment, Address.AddressInsufficientBalance(_msgSender())) ;
        }
    }

    function _setFeeFactor(uint256 _feeFactor) private {
        feeFactor =  _feeFactor ;
    }

    function _getFeeOf(uint256 amount) private view returns (uint256) {
        return (amount * feeFactor / 10000) / 2 ;
    }

}
