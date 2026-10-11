using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Collections.Generic;
class NativeBridge {
 static string Quote(string value) {
  StringBuilder result=new StringBuilder("\"");int slashes=0;
  foreach(char c in value){if(c=='\\'){slashes++;continue;}if(c=='"'){result.Append('\\',slashes*2+1);result.Append(c);}else{result.Append('\\',slashes);result.Append(c);}slashes=0;}
  result.Append('\\',slashes*2);result.Append('"');return result.ToString();
 }
 static void Copy(Stream source,Stream target){try{byte[] buffer=new byte[8192];int size;while((size=source.Read(buffer,0,buffer.Length))>0){target.Write(buffer,0,size);target.Flush();}}catch(IOException){} }
 static void Main(string[] args){
  try{
   string root=Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
   var config=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(root,"config.json")));
   string node=(string)config["node"],script=config.ContainsKey("hostScript")?(string)config["hostScript"]:Path.Combine(root,"youtube-host.mjs");
   ProcessStartInfo info=new ProcessStartInfo(node,Quote(script)+" "+Quote(args.Length>0?args[0]:""));
   info.UseShellExecute=false;info.CreateNoWindow=true;info.WindowStyle=ProcessWindowStyle.Hidden;
   info.RedirectStandardInput=true;info.RedirectStandardOutput=true;info.RedirectStandardError=true;info.WorkingDirectory=root;
   using(Process child=Process.Start(info)){
    Thread input=new Thread(delegate(){Copy(Console.OpenStandardInput(),child.StandardInput.BaseStream);try{child.StandardInput.Close();}catch{}});input.IsBackground=true;
    Thread output=new Thread(delegate(){Copy(child.StandardOutput.BaseStream,Console.OpenStandardOutput());});
    Thread errors=new Thread(delegate(){Copy(child.StandardError.BaseStream,Console.OpenStandardError());});errors.IsBackground=true;
    input.Start();output.Start();errors.Start();child.WaitForExit();output.Join();
   }
  }catch(Exception){/* Native runtime reports a clean disconnect; never show a console window. */}
 }
}
