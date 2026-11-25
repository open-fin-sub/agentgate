import {test,expect} from '@playwright/test'
import { passAuthGate } from './auth-gate';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await passAuthGate(page);
});

test('dataset and evaluator menu actions follow published state',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/#datasets')
 await expect(page.getByRole('button',{name:'按 ID 打开',exact:true})).toHaveCount(0)
 await page.getByLabel('搜索测评集').fill('loan-risk-policy')
 const card=page.getByTestId('dataset-item-loan-risk-policy')
 await card.getByRole('button',{name:'更多操作',exact:false}).click()
 await expect(page.getByRole('menuitem',{name:'查看详情',exact:true})).toBeVisible()
 await page.getByRole('menuitem',{name:'归档',exact:true}).click()
 const archive=page.getByRole('dialog',{name:'归档测评集',exact:true})
 await expect(archive).toContainText('历史版本和测评报告仍可查看')
 await expect(archive.getByLabel('待删除版本')).toHaveCount(0)
 await archive.getByRole('button',{name:'取消',exact:true}).click()
 await page.goto('/#datasets/loan-risk-policy')
 await page.getByTestId('version-published-1').click()
 await expect(page.getByTestId('run-single-case')).toHaveCount(0)
 await expect(page.getByTestId('continue-draft')).toHaveCount(0)
 await page.getByTestId('run-dataset-version').click()
 const dialog=page.getByRole('dialog',{name:'新建测评任务'})
 await expect(dialog.getByRole('button',{name:'推荐评估器',exact:true})).toBeVisible()
 await expect(dialog.getByRole('region',{name:'测评对象来源与图谱'})).toHaveCount(0)
 await dialog.getByRole('button',{name:'取消',exact:true}).click()
 await page.goto('/#evaluators/skill-routing')
 await expect(page.getByRole('button',{name:'复制为自定义草稿',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'禁用',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'复制为自定义草稿',exact:true}).click()
 await expect(page.getByRole('dialog',{name:'新建评估器草稿'})).toBeVisible()
 expect(errors).toEqual([])
})
