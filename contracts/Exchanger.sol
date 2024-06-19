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
    mapping(uint256 id => IExchanger.Order order) private _orders ;

    constructor(uint256 _feeFactor) Ownable(_msgSender()) {
        _setFeeFactor(_feeFactor) ;
    }

    function listItem(uint256 id, uint64 deadline, uint256 amount) public {
        listItem(id, deadline, amount, address(0)) ;
    }

    function listItem(uint256 id, uint64 deadline, uint256 amount, address token) public {
        require(
            _orders[id].state == IExchanger.OrderState.NonExistent &&
            deadline > block.timestamp &&
            amount > 0,
            IExchanger.InvalidOrderData()
        );

        IExchanger.Order memory order = IExchanger.Order({
            seller: _msgSender(),
            deadline: deadline,
            amount: amount,
            token: token,
            state: IExchanger.OrderState.Initialized
        }) ;
        _orders[id] = order ;
        emit IExchanger.OrderCreated(id, _msgSender(), deadline, amount, token) ;
    }

    function buyItem(uint256 id) external payable nonReentrant {
        IExchanger.Order memory order = _orders[id] ;
        require(
            order.state == IExchanger.OrderState.Initialized &&
            block.timestamp <=  order.deadline,
            IExchanger.InvalidOrderState()
        ) ;
        require(
            order.seller != _msgSender() ,
            IExchanger.InvalidOrderBuyer()
        ) ;

        _executePayments(order) ;
        _orders[id].state = IExchanger.OrderState.Paid ;
        emit IExchanger.OrderPurchased(id, order.seller, _msgSender(), order.amount, order.token) ;
    }

    function delistItem(uint256 id) external {
        IExchanger.Order memory order = _orders[id] ;
        address sender = _msgSender() ;

        require(
            order.state == IExchanger.OrderState.Initialized,
            IExchanger.InvalidOrderState()
        ) ;
        require(
             sender == order.seller || sender == owner(),
            IExchanger.InvalidOrderSeller()
        ) ;

        delete _orders[id] ;
        emit IExchanger.OrderDeleted(id) ;
    }


    function setFeeFactor(uint256 _feeNumerator) external onlyOwner {
        _setFeeFactor(_feeNumerator) ;
    }

    function getListing(uint256 id) external view returns (IExchanger.Order memory) {
        return _orders[id] ;
    }

    function _executePayments(IExchanger.Order memory order) private {
        uint256 fee = _getFeeOf(order) ;
        if (order.token == address(0)) {
            Address.sendValue(payable(owner()), fee) ;
            Address.sendValue(payable(order.seller), order.amount) ;
        } else {
            IERC20(order.token).transferFrom(_msgSender(), owner(), fee) ;
            IERC20(order.token).transferFrom(_msgSender(), order.seller, order.amount) ;
        }
    }

    function _getFeeOf(IExchanger.Order memory order) private view returns (uint256) {
        return (order.amount * feeFactor / 10000) ;
    }

    function _setFeeFactor(uint256 _feeFactor) private {
        feeFactor =  _feeFactor ;
    }

}
