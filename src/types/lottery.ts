export interface LotteryCode {
  id: string
  code: string
  status: 'unused' | 'won'
  createdAt: string
  wonAt?: string
  winnerPhone?: string
  lotteryId: string // 关联到具体的抽奖活动
  prizeType: string // 奖品类型/等级
  prizeName: string // 奖品名称
  prizeValue?: string // 奖品价值
  prizeDescription?: string // 奖品描述
  prizeImage?: string // 奖品图片URL
  weight: number // 权重，用于控制中奖概率
}

export interface DrawRecord {
  id: string
  phone: string
  drawnAt: string
  won: boolean
  lotteryCode?: string
  lotteryId: string // 关联到具体的抽奖活动
  lotteryName: string // 抽奖活动名称
  prizeType?: string // 中奖的奖品类型
  prizeName?: string // 中奖的奖品名称
  ipAddress?: string
}

export interface PrizeType {
  id: string
  name: string // 奖品类型名称，如"一等奖"、"二等奖"
  description: string // 描述
  weight: number // 权重，数值越大中奖概率越高
  color: string // 显示颜色
  icon: string // 图标
  totalCount?: number // 总数量
  remainingCount?: number // 剩余数量
}

// 抽奖限制类型
export interface LotteryRestrictions {
  // 手机号限制
  phoneRestriction: {
    enabled: boolean
    maxDrawsPerPhone: number // 每个手机号最大抽奖次数
    resetPeriod: 'never' | 'daily' | 'weekly' | 'monthly' // 重置周期
  }

  // IP限制
  ipRestriction: {
    enabled: boolean
    maxDrawsPerIP: number // 每个IP最大抽奖次数
    resetPeriod: 'never' | 'daily' | 'weekly' | 'monthly' // 重置周期
  }

  // 时间限制
  timeRestriction: {
    enabled: boolean
    cooldownMinutes: number // 抽奖冷却时间（分钟）
  }

  // 组合限制
  combinedRestriction: {
    enabled: boolean
    maxDrawsPerPhonePerDay: number // 每个手机号每天最大抽奖次数
    maxDrawsPerIPPerDay: number // 每个IP每天最大抽奖次数
  }
}

// 显示设置类型
export interface DisplaySettings {
  pageTitle: string // 网页标题
  pageDescription: string // 网页描述
  showWinRate: boolean // 是否显示中奖率
  showRemainingCount: boolean // 是否显示剩余奖品数
  showParticipantCount: boolean // 是否显示参与人数
  customFooterText?: string // 自定义页脚文字
  hideActivitySelector: boolean // 是否隐藏活动选择器
  customCss?: string // 自定义CSS样式
}

export interface LotteryActivity {
  id: string
  name: string
  description: string
  winRate: number // 中奖率 0-100
  isActive: boolean // 抽奖是否开启
  isArchived?: boolean // 是否归档
  archivedAt?: string | null // 归档时间
  maxDrawsPerPhone: number // 每个手机号最大抽奖次数（保留兼容性）
  createdAt: string
  startTime?: string
  endTime?: string
  backgroundColor: string // 背景颜色主题
  icon: string // 图标名称
  prizeTypes: PrizeType[] // 奖品类型配置
  exchangeInstructions?: string // 兑换码使用说明（可选）
  restrictions?: LotteryRestrictions // 抽奖限制配置
  displaySettings: DisplaySettings // 显示设置
  availableCount?: number
  participantCount?: number
}

export interface LotteryState {
  activities: LotteryActivity[]
  codes: LotteryCode[]
  records: DrawRecord[]
  drawnPhones: Map<string, Set<string>> // phone -> Set<lotteryId>
  currentActivityId: string | null
}
