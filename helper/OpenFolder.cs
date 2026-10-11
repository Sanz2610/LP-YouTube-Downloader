using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Web.Script.Serialization;
using System.Collections.Generic;

// No console, PowerShell, Shell.Application automation or page-supplied path.
class OpenFolder {
 static int Main(){
  try{
   string root=Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
   var config=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(root,"config.json")));
   string folder=Path.GetFullPath((string)config["downloadsDir"]);
   if(!Directory.Exists(folder))return 2;
   var start=new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"explorer.exe"),"/e,\""+folder+"\"");
   start.UseShellExecute=false;start.CreateNoWindow=false;start.WindowStyle=ProcessWindowStyle.Normal;
   using(Process process=Process.Start(start)){if(process==null)return 3;}
   return 0;
  }catch{return 1;}
 }
}
