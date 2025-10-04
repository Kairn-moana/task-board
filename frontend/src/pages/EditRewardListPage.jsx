import React, { useState, useEffect } from "react";
import RewardItem from "../components/RewardItem";
import AddRewardForm from "../components/AddRewardForm";
import {
  getRewardItems,
  createRewardItem,
  updateRewardItem,
  deleteRewardItem,
} from "../api/services/rewardService";
import "./EditPage.css";

class EditRewardListPage extends React.Component {
  state = {
    items: [],
    isLoading: true,
  };

  componentDidMount() {
    this.fetchItems();
  }

  fetchItems = async () => {
    this.setState({ isLoading: true });
    try {
      const rewardItems = await getRewardItems();
      this.setState({ items: rewardItems });
    } catch (error) {
      console.error("无法加载奖励清单:", error);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleAddItem = async (newItemData) => {
    try {
      const newItem = await createRewardItem(newItemData);
      this.setState((prevState) => ({ items: [newItem, ...prevState.items] }));
    } catch (error) {
      console.error("添加奖励失败:", error);
    }
  };

  handleUpdateItem = async (itemId, updates) => {
    try {
      const updatedItem = await updateRewardItem(itemId, updates);
      this.setState((prevState) => ({
        items: prevState.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
      }));
    } catch (error) {
      console.error("更新奖励失败:", error);
    }
  };

  handleDeleteItem = async (itemId) => {
    try {
      await deleteRewardItem(itemId);
      this.setState((prevState) => ({
        items: prevState.items.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error("删除奖励失败:", error);
    }
  };

  render() {
    const { items, isLoading } = this.state;

    if (isLoading) {
      return <div className="page-container">正在加载您的奖励清单...</div>;
    }

    return (
      <div className="page-container">
        <header className="page-header">
          <h1>🎁 编辑我的奖励清单</h1>
          <p>在这里管理你的奖励，按分类添加新奖励。</p>
        </header>

        <AddRewardForm onAdd={this.handleAddItem} />

        <div className="items-list">
          {items.map((item) => (
            <RewardItem
              key={item.id}
              item={item}
              onUpdate={this.handleUpdateItem}
              onDelete={this.handleDeleteItem}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default EditRewardListPage;
